[] - Update workflow actions
[] - Update repos
    [] - Update effect subtrees
        [] - `git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash`
        [] - `git subtree pull --prefix=repos/effect-smol https://github.com/Effect-TS/effect-smol.git main --squash`
    [] - Update frida submodules
        [] - `git submodule update --remote --recursive repos/frida-core`
        [] - `git submodule update --remote --recursive repos/frida-gum`
        [] - `git submodule update --remote --recursive repos/frida-node`
        [] - `git submodule update --remote --recursive repos/frida-python`
        [] - `git submodule update --remote --recursive repos/frida-tools`
        [] - `git add repos/frida-{core,gum,node,python,tools} && git commit -m "Update frida submodules"`
