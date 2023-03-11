---
layout: post
title: "Typescripting the technical interview"
excerpt: "An homage to Aphyr's Typing the technical interview"
image: /static/images/7-queens-solution.png
---

# Typescripting the technical interview

An homage to Aphyr's [Typing the technical interview](https://aphyr.com/posts/342-typing-the-technical-interview)

-------

Criss shows you into a meeting room.

Hoodie clad, and resembling no animal in particular, he seems familiar. Though you're
confident you haven't met. The room too, though this is your first visit.

"How're you doing?" he asks

A difficult question to begin with, to explain what inner workings drive your
actions. Perhaps the question is rhetorical?

"How indeed", you smile.

"... umm, great. Okay, shall we get into it?"

You nod, reassuringly.

"Right. So we're going to do a little programming puzzle, so I can understand
how you solve problems. Don't worry if you're not able to complete the exercise,
the main thing is for me to get a feel for how you think and communicate."

Worry? You struggle to recall the feeling. Perhaps in your youth, wintering in
Svalbard amongst the bears. Before you understood the seiðr.

"The problem is called N-Queens" Criss continues, "and it’s fairly simple. Given
an NxN chessboard, you need to find a way to place N queens on that board
safely. Try to keep your code concise."

The trickle of déjà vu you were feeling becomes a flood. You _have_ met Criss
before. In this room, solving this puzzle. But the memory won't recall. Perhaps,
in a past life? But he's far too young for that.

Pause a moment to compose yourself.

"Can I use any language?" you repeat.

"Well... we're mostly a TypeScript shop. And we've had some ...  unfortunate
experiences with people using other languages. A candidate used Haskell once,
and I did struggle a little bit to follow along. It wasn't particularly concise."

Ahhhhh. Vidrun has been here. That explains the déjà vu. You have shared much.

"TypeScript then", you agree. Criss looks reassured. His doom is already set.

"We'll need to start with a few runes", you say.

Criss chips in immediately. "Runes, like in Go? Didn't we _just_ agree to use TypeScript?"

"Oh, no, not those kinds of runes. Runes, shadows of meaning. Symbolic. Unique."

Inhale, inscribe.

```typescript
const ᚾ = Symbol()
const ᛊ = Symbol()
const ᛚ = Symbol()
const ᛞ = Symbol()
```

"TypeScript is duck typed, you see. And one duck must not be confused for another."

"You mean it's structurally typed? Unlike something nominally typed like Java, or Haskell?"

"Yes, exactly", you respond. Perhaps Criss is following after all. "Here, I'll show you."

Summon the void itself, and bind it with the essence of `ᚾ`. Need, nothingness, the frustrated longing to become.

```typescript
type Nil = typeof ᚾ
```

"Hold on, don't we already have null and undefined? Why are we defining our own type for Nil?"

"The built in types come with too much baggage - null, undefined, falsey values. Better to start from a clean beginning."

Smiling contentedly at the memory of Vidrun, complete the linked list.

```typescript
type Cons<x, xs> = [x, xs]
```

You hear Criss' breath catch. Quickly, before he can escape.

"So, we've got a list which we'll use to store our queens. We'll need to be able
to glue lists together, so let's start with a concat function."

```typescript
type Concat<seq1, seq2> = seq1 extends Nil
    ? seq2
    : seq1 extends Cons<infer car, infer cdr>
        ? Cons<car, Concat<cdr, seq2>>
        : Cons<seq1, seq2>
```

"No" Criss whispers under his breath, "not again".

"Let's do booleans, to represent threat and safety"

Truth, fire, a sun. Bound with ᛊ. <br />
Lies, falsehood, the depths of a lake. Bound with ᛚ.

```typescript
type True = typeof ᛊ
type False = typeof ᛚ
```

"And some simple logic"

```typescript
type Not<b1> = b1 extends True ? False : b1 extends False ? True : never
type Or<b1, b2> = b1 extends True ? True : b2 extends True ? True : False
```

"... but why ..." Criss begins, but doesn't finish. Don't worry. Continue.

Is there any truth? You sometimes wonder.

```typescript
type AnyTrue<list> = list extends Cons<infer x, infer xs>
    ? x extends True
        ? True
        : AnyTrue<xs>
    : False
```

"We'll need to represent the coordinates of our queens, so we'll need numbers too."

Start by ensnaring zero. ᛞ, the day rune. Use a zero day and carry the zero.

```typescript
type Zero = typeof ᛞ
```

"Now we can define the rest of the natural numbers, building on zero."

```typescript
type S<n> = [n]

type One   = S<Zero>
type Two   = S<One>
type Three = S<Two>
type Four  = S<Three>
type Five  = S<Four>
type Six   = S<Five>
```

Criss is completely grey now. His breath begins to cloud, as the chill in the air intensifies. He knows what's coming.

"We'll need to be able to do a couple of operations on our numbers. Equality, difference."

"Important concepts in a company like this.", you add. Noting the distinct lack of the latter over the tundra of the open plan office.

```typescript
type Equals<a, b> = a extends S<infer a_>
    ? b extends S<infer b_>
        ? Equals<a_, b_>
        : False
    : b extends Zero
        ? True
        : False

type AbsDiff<a, b> = a extends S<infer a_>
    ? b extends S<infer b_>
        ? AbsDiff<a_, b_>
        : a
    : b extends S<any>
        ? b
        : Zero
```

"And for convenience, let's have a function to create a range from zero to n."

```typescript
type RangeFromZeroTo<n, xs = Nil> = n extends S<infer n_>
    ? RangeFromZeroTo<n_, Cons<n, xs>>
    : Cons<Zero, xs>
```

"Criss! Criss, we're ready now. It's okay, we're ready now."

He's mumbling something under his breath. "not again. not again."

Define a queen. Any queen of your clan would need more depth than just x and y,
but keep it simple.

```typescript
type Queen<x, y> = [x, y]
```

Create a row of queens. Too threatening to be on the same row, at the same time,
in the same universe. They will have to be divided across the multiverse. This
too has happened, in the history of your kind.

```typescript
type RowOfQueens<cols, row> = cols extends Cons<infer col, infer cols_>
    ? Cons<Queen<row, col>, RowOfQueens<cols_, row>>
    : cols
```

"A queen threatens another if she is in the same row, column, or diagonal."

```typescript
type Threatens<a, b> = a extends Queen<infer ax, infer ay>
    ? b extends Queen<infer bx, infer by>
        ? Or<
            Or<Equals<ax, bx>, Equals<ay, by>>,
            Equals<AbsDiff<ax, bx>, AbsDiff<ay, by>>
        >
        : never : never
```

"never... never..." whimpers Criss. You're not sure if this is a question about
the code, but explain:

"Threatens shouldn't be called with anything that isn't a Queen. We're using 
`never` to represent the exception where it's called with the wrong types."

You've swam upon the devil's lake, but never, never, never, never. You'll never
make the same mistake. No, never, never, never.

"We're going to work our way down the rows of the chess board, placing queens
wherever possible. Given a list of already placed queens, which ones would
threaten a new queen?"

```typescript
type ThreateningQueens<placedQueens, queen> =
    placedQueens extends Cons<infer placedQueen, infer placedQueens_>
        ? Cons<
            Threatens<placedQueen, queen>,
            ThreateningQueens<placedQueens_, queen>
        >
        : Nil
```

"A queen is safe only if none of the other queens are threatening her."

```typescript
type Safe<placedQueens, queen> =
    Not<AnyTrue<ThreateningQueens<placedQueens, queen>>>
```

"Now taking a list of possible queens, which ones would be safe from the queens already on the board?"

```typescript
type FilterSafeQueens<candidates, placedQueens> =
    candidates extends Cons<infer q, infer qs>
        ? Safe<placedQueens, q> extends True
            ? Cons<q, FilterSafeQueens<qs, placedQueens>>
            : FilterSafeQueens<qs, placedQueens>
        : Nil
```

"As we work down the board, we only need to consider the positions in the next row where a queen would be safe."

```typescript
type Next<row, placedQueens = Nil> =
    FilterSafeQueens<RowOfQueens<RangeFromZeroTo<N>, row>, placedQueens>
```

"Criss, are you ready?"

His eyelashes are coated with frost, framing a beautiful pair of eyes. Beautiful, but devoid of focus.

"A pair of mutually recursive functions to find the solution."

Two lovers, they waltz. Not every step forwards, but backtracking, spinning, gently alighting on the answer at just the right moment.

```typescript
type SolveNextRow<row, placedQueens> =
    Solve<Next<S<row>, placedQueens>, S<row>, placedQueens>

type Solve<candidates, row, placedQueens> = Equals<row, N> extends True
    ? Concat<candidates, placedQueens>
    : candidates extends Cons<infer x, infer xs>
        ? SolveNextRow<row, Cons<x, placedQueens>> extends Nil
            ? Solve<xs, row, placedQueens>
            : SolveNextRow<row, Cons<x, placedQueens>>
        : Nil
```

"Criss" you say gently "the solution"

```typescript
type N = Six
type Solution = Solve<Next<Zero>, Zero, Nil>
```

A mouse flits across the Solution, and the language server renders:

```typescript
Cons<
 Queen<S<S<S<S<S<S<typeof ᛞ>>>>>>, Five>,
 Cons<
  Queen<S<S<S<S<S<typeof ᛞ>>>>>, Three>,
  Cons<
   Queen<S<S<S<S<typeof ᛞ>>>>, One>,
   Cons<
    Queen<S<S<S<typeof ᛞ>>>, Six>,
    Cons<
     Queen<S<S<typeof ᛞ>>, Four>,
     Cons<
      Queen<S<typeof ᛞ>, Two>,
      Cons<
       Queen<typeof ᛞ, typeof ᛞ>,
      >
     >
    >
   >
  >
 >
>
```

"So that's queens at (0,0), (1,2), (2,4), (3,6), (4,1), (5,3) and (6,5). Does that work Criss?"

You sketch the solution on the whiteboard.

![A 7 by 7 chess board, showing 7 queens placed in positions where they don't threaten each other. Queens are in (0,0), (1,2), (2,4), (3,6), (4,1), (5,3) and (6,5)](/static/images/7-queens-solution.png)

As warmth begins to return to the room, Criss starts to recover.

"Okay, that looks like a correct solution, but the code is quite hard to follow, and it's not very concise." he asserts, wrongly.

"Oh it's mostly just TypeScript boilerplate. I think you'll find once it's compiled down to JavaScript it's perfectly concise." you reassure him.

Invoke the compiler

```shell
$ tsc *.ts --lib esnext --outFile /dev/stdout 
var ᚾ = Symbol();
var ᛊ = Symbol();
var ᛚ = Symbol();
var ᛞ = Symbol();
```

Criss looks like he's been slapped. You leave him to it and show yourself out.
