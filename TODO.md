[] - Update workflow actions
[] - Update repos
    [] - Update effect subtrees
        [] - `git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash`
        [] - `git subtree pull --prefix=repos/effect-smol https://github.com/Effect-TS/effect-smol.git main --squash`
    [] - Update frida submodules
        [] - `git submodule update --remote repos/frida-core repos/frida-gum repos/frida-node repos/frida-python repos/frida-tools`
        [] - `git submodule foreach git submodule update --init --recursive`
