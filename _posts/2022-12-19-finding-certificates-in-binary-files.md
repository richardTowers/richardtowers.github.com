---
layout: post
title: "We're going on a certificate hunt!"
excerpt: "We're going to catch an X.509 certificate. What a beautiful day! We're not scared."
---

# We're going on a certificate hunt!

I've spent a lot of my career wrangling certificates. They're used to secure
traffic on the web, they're used in authentication protocols like SAML, they're
used for signing and encrypting various other kinds of document.

Certificates can be represented / disguised in a few different formats, and
some of them are easier to spot than others.

Recently I had to find an Adobe Reader Extensions certificate embedded in a PDF
document, which pushed my certificate hunting skills to the limit. This is the
story of that hunt.

## Why are there certificates living in a PDF?

A particularly unpleasant legacy service at work uses PDF forms, which users
have to fill in using Adobe Acrobat Reader. The form filling functionality is
proprietary - you can only fill in PDF forms in Acrobat if the PDF was signed
by a particular key issued by Adobe. Which keys are trusted to sign these PDFs
is controlled by embedded certificates.

The certificate we were using was due to expire, so we updated it. I wanted to
verify that the PDFs being produced were using the new certificate and not the
old one (without waiting for the old one to expire and seeing if everything
broke).

## Part 1: strings

PDF documents are a combination of ASCII characters and binary data. On the
hope that the certificate I was looking for might be encoded in ASCII, I ran
the `strings` command on the PDF.

```
$ strings file.pdf
%PDF-1.7
41 0 obj
<</Filter/FlateDecode/First 23/Length 137/N 4/Type/ObjStm>>stream
R)i/P
``Zp
...
```

Unfortunately, there was nothing as obvious as `-----BEGIN CERTIFICATE-----`
(which indicates a PEM formatted certificate). The most promising bit of the
file looked like this:

```
<</Type/Sig/Filter/Adobe.PPKLite/SubFilter/adbe.pkcs7.detached/
... snip ...
Contents<308006092886f70d01010b0500306c
...snip about 12000 characters ...
00000000000000000000000000000000>
```

It's not a certificate, but the `<</Type/Sig` bit suggests it might be a
signature, which could well contain the certificate.

So perhaps there are some certificates hiding inside the big `Contents<...>`
string.

## Part 2: A fistful of octets

The structure of a certificate is defined by [X.509](https://en.wikipedia.org/wiki/X.509),
which is based on [ASN.1](https://en.wikipedia.org/wiki/ASN.1).

This structure is usually encoded using
[DER](https://en.wikipedia.org/wiki/X.690#DER_encoding), and sometimes further
encoded using [PEM](https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail).

Which is all pretty confusing.

To find a certificate shaped needle in our haystack of
`Contents<30800609288...` we need to know a bit about what to expect though.

Certificates always begin with [an ASN.1
Sequence](https://datatracker.ietf.org/doc/html/rfc1422#autoid-5), which (in
hexadecimal format) is represented by the number 30. The next octet (two
hexadecimal characters) specifies the length of the sequence.

In DER, [length encoding can be "short form" or "long form"](https://en.wikipedia.org/wiki/X.690#Length_octets).

Certificates are always longer than 127 bits, so the length will always be in
long form.  Certificates are also always longer than 256 bits, and almost
always shorter than 65,536 bits, which means DER needs two octect to specify
the sequence length.

This means the next octet will be 82, and that the next two octets will depend
on the length of the certificate.

So we know the beginning of the certificate will be `3082....`.

This is why PEM certificates always start with `MII` (which you might have
noticed if you work with certificates a lot).

```
$ xxd -r -p <<< '3082' | base64    
MII=
```

grepping our haystack for 3082 followed by four hex characters yields a few candidates:

```
$ grep -a -o '3082....' file.pdf 
308205a4
3082038c
30820222
3082020a
30820609
308203f1
30820122
3082010a
30820198
308206a1
30820489
30820222
3082020a
30820130
3082020c
```

Encouraging, but we only expect to see three or four certificates (assuming the
whole chain is included), so this is too many matches. Can we be more precise?

## Part 3: A few octets more

Fortunately, the first bit of the ASN.1 Sequence which makes up a certificate
is another, nested ASN.1 sequence. And this one is also (almost) always between
256 and 65,536 bits long. By the same reasoning as above, we can tell that the
two octets following the four we already worked out will also be 3082. So the
pattern we should look for is `3082....3082`:

```
$ grep -a -o '3082....3082' file.pdf 
308205a43082
308206093082
308206a13082
```

Now we're down to just three matching prefixes - could these be the starts of
our certificates?

## Part 4: The good, the bad, and the ugly

We've worked out the starts of our certificates, but we haven't worked out
where they end. Fortunately, openssl is happy to pick up the first certificate
it sees and ignore everything after it, so we can actually skip that bit and
jump straight to trying to parse the (maybe) certificates.

We'll need to decode the hexadecimal into binary (using `xxd -r -p`), and then
pass them to openssl (with `openssl x509 -inform DER`):

Taking the first prefix we found:

```
$ grep -a -o '308205a43082[0-9a-f]*' file.pdf | xxd -r -p | openssl x509 -inform DER
-----BEGIN CERTIFICATE-----
MIIFpDCCA4ygAwIBAgIQXfEvX1enw+GwAtiTJwzd4TANBgkqhkiG9w0BAQsFADBs
MQswCQYDVQQGEwJVUzEjMCEGA1UEChMaQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0
... snip ...
7quYkGyLWtTtZoB5J1b7OYUraMDuqG1s39jMchHjda1GqOwsBWxDqC4HqtdY7TK2
ofZLvqTHvT4=
-----END CERTIFICATE-----
```

TADA! And indeed this works for the other two prefixes - there are three
certificates in this PDF, a root, an intermediate and a leaf.

## Conclusion

This general technique of looking for hexadecimal streams matching
`/3082....3082/` should be a fairly robust way of finding certificates in
binary files. It might occasionally trip up if a certificate is very long or
very short, and it might find some false positives (particularly if there's
other ASN.1 data in the file).

In our case we were lucky that the bit where the certificate lived was already
hex encoded, but it could probably still be spotted in the hexdump of a binary
file.

If the certificate were base64 encoded instead of hex encoded, you could use
the same trick with the pattern `/MI....CC/` (or something like that).

## Bonus: PKCS7 and parsing ANS.1 with openssl

After I'd worked all of this out, I realised that the whole
`Contents<30800609288...>` string was itself in ASN.1 format, specifically
[PKCS #7](https://en.wikipedia.org/wiki/PKCS_7). This means there are a couple
of easier ways to parse it (but which might not work in other files).

The prefix `3080` means "a sequence of indeterminate length" (whereas `3082`
means "a sequence of length specified in the next two octets").

Parsing the whole thing as PKCS #7:

```
$ grep -a -o 'Contents<[0-9a-f]*' file.pdf | cut -d '<' -f 2 | xxd -r -p | openssl pkcs7 -inform DER -noout -print
PKCS7: 
  type: pkcs7-signedData (1.2.840.113549.1.7.2)
  d.sign: 
    version: 1
    md_algs:
        algorithm: sha1 (1.3.14.3.2.26)
        parameter: NULL
    contents: 
      type: pkcs7-data (1.2.840.113549.1.7.1)
      d.data: <ABSENT>
... snip ...
```

(This includes the certificate data I was looking for, albeit in a slightly inconvenient format)

Or parsing as ASN.1:

```
$ grep -a -o 'Contents<[0-9a-f]*' file.pdf | cut -d '<' -f 2 | xxd -r -p | openssl asn1parse -inform DER
    0:d=0  hl=2 l=inf  cons: SEQUENCE          
    2:d=1  hl=2 l=   9 prim: OBJECT            :pkcs7-signedData
   13:d=1  hl=2 l=inf  cons: cont [ 0 ]        
   15:d=2  hl=2 l=inf  cons: SEQUENCE          
   17:d=3  hl=2 l=   1 prim: INTEGER           :01
   20:d=3  hl=2 l=  11 cons: SET               
   22:d=4  hl=2 l=   9 cons: SEQUENCE          
   24:d=5  hl=2 l=   5 prim: OBJECT            :sha1
   31:d=5  hl=2 l=   0 prim: NULL              
   33:d=3  hl=2 l=inf  cons: SEQUENCE   
```

