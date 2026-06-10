# @efffrida/vitest-pool

## 0.0.27

### Patch Changes

- Updated dependencies [f582fc4]
  - @efffrida/frida-tools@0.0.37

## 0.0.26

### Patch Changes

- 2d7ca22: Frida 17.11.0 <https://frida.re/news/2026/06/05/frida-17-11-0-released/>
- Updated dependencies [2d7ca22]
  - @efffrida/frida-tools@0.0.36
  - @efffrida/polyfills@0.0.12

## 0.0.25

### Patch Changes

- b6b26e6: Bump tar and ioredis dependencies
- c9fd13b: Bump Vitest dependencies
- Updated dependencies [b6b26e6]
- Updated dependencies [c9fd13b]
  - @efffrida/frida-tools@0.0.35

## 0.0.24

### Patch Changes

- 0c867fd: Make FridaScript load, layer, and watch functions also accept a string for the entrypoint
- 5729e6c: Move schemas to @efffrida/frida-tools
- Updated dependencies [0c867fd]
- Updated dependencies [5729e6c]
  - @efffrida/frida-tools@0.0.34

## 0.0.23

### Patch Changes

- 445b216: Upgrade frida to 17.10.1 <https://frida.re/news/2026/06/02/frida-17-10-1-released/>
- Updated dependencies [445b216]
  - @efffrida/frida-tools@0.0.33
  - @efffrida/polyfills@0.0.11

## 0.0.22

### Patch Changes

- fed76e6: Improve error reporting and simplify vitest pool
- Updated dependencies [fed76e6]
  - @efffrida/frida-tools@0.0.32

## 0.0.21

### Patch Changes

- 3c49b85: Make flatted a dev dependency so that it gets peered correctly

## 0.0.20

### Patch Changes

- 814697e: Fix dependencies

## 0.0.19

### Patch Changes

- dc0dc2c: Include TS files in vitest-pool publish files

## 0.0.18

### Patch Changes

- 6a69bda: Copy agent artifact correctly instead of transpiling it
- 6a69bda: Bump dependencies
- 31be93f: Bump Vite and Vitest
- Updated dependencies [6a69bda]
- Updated dependencies [31be93f]
  - @efffrida/frida-tools@0.0.31

## 0.0.17

### Patch Changes

- 0ac4d62: Copy agent artifact correctly instead of transpiling it

## 0.0.16

### Patch Changes

- 0b4af19: Test publish after modifying changeset config
- Updated dependencies [0b4af19]
  - @efffrida/frida-tools@0.0.30

## 0.0.15

### Patch Changes

- 67ab3d9: QuickJS returns Error.stack as a boxed String object, not a primitive. This
  causes @vitest/utils serializeValue to walk it as a char-indexed object
  {"0":"A","1":"s",...}. Adding toJSON makes serializeValue call valueOf()
  instead, returning the primitive string.

  ```typescript
  if (!("toJSON" in String.prototype)) {
    (String.prototype as any).toJSON = String.prototype.valueOf;
  }
  ```

## 0.0.14

### Patch Changes

- 76b7c23: Bump dependencies
- Updated dependencies [76b7c23]
  - @efffrida/frida-tools@0.0.29

## 0.0.13

### Patch Changes

- 325d6fd: Migrate to effect-smol
- Updated dependencies [325d6fd]
  - @efffrida/frida-tools@0.0.28
  - @efffrida/polyfills@0.0.7

## 0.0.12

### Patch Changes

- 0aed69e: Test new publishing workflow
- Updated dependencies [0aed69e]
  - @efffrida/frida-tools@0.0.27
  - @efffrida/polyfills@0.0.6

## 0.0.11

### Patch Changes

- 0009f3f: Bump dependencies
- Updated dependencies [0009f3f]
  - @efffrida/frida-tools@0.0.26
  - @efffrida/polyfills@0.0.5

## 0.0.10

### Patch Changes

- fe03a5c: Bumped dependencies
- Updated dependencies [fe03a5c]
  - @efffrida/frida-tools@0.0.25
  - @efffrida/polyfills@0.0.4
