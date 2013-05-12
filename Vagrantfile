Vagrant.configure("2") do |config|
  config.vm.box = "precise32"
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"
  config.vm.network :forwarded_port, guest: 4000, host: 4000
  config.vm.provision :shell, :path => "bootstrap.sh"
end
