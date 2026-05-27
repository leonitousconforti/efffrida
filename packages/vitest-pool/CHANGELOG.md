# @efffrida/vitest-pool

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
