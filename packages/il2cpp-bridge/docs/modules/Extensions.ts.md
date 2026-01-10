---
title: Extensions.ts
nav_order: 4
parent: Modules
---

## Extensions.ts overview

Since v1.0.0

---

## Exports Grouped by Category

- [Extensions](#extensions)
  - [Dictionary (class)](#dictionary-class)
    - [lift (static method)](#lift-static-method)
    - [of (static method)](#of-static-method)
    - [get (method)](#get-method)
    - [set (method)](#set-method)
    - [add (method)](#add-method)
    - [clear (method)](#clear-method)
    - [containsKey (method)](#containskey-method)
    - [containsValue (method)](#containsvalue-method)
    - [find (method)](#find-method)
    - [remove (method)](#remove-method)
    - [[Symbol.iterator] (method)](#symboliterator-method)
    - [toString (method)](#tostring-method)
    - [toRecord (method)](#torecord-method)
  - [List (class)](#list-class)
    - [lift (static method)](#lift-static-method-1)
    - [of (static method)](#of-static-method-1)
    - [get (method)](#get-method-1)
    - [set (method)](#set-method-1)
    - [add (method)](#add-method-1)
    - [clear (method)](#clear-method-1)
    - [contains (method)](#contains-method)
    - [indexOf (method)](#indexof-method)
    - [insert (method)](#insert-method)
    - [remove (method)](#remove-method-1)
    - [reverse (method)](#reverse-method)
    - [sort (method)](#sort-method)
    - [[Symbol.iterator] (method)](#symboliterator-method-1)
    - [toString (method)](#tostring-method-1)

---

# Extensions

## Dictionary (class)

**Signature**

```ts
declare class Dictionary<K, V>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L14)

Since v1.0.0

### lift (static method)

Lifts an Il2Cpp.Object to a Dictionary.

**Signature**

```ts
declare const lift: <K extends Il2Cpp.Field.Type = Il2Cpp.Field.Type, V extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
  object: Il2Cpp.Object
) => Dictionary<K, V>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L112)

### of (static method)

Creates a new dictionary with the given elements.

**Signature**

```ts
declare const of: <K extends Il2Cpp.Field.Type = Il2Cpp.Field.Type, V extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
  keyClass: Il2Cpp.Class,
  valueClass: Il2Cpp.Class,
  elements?: Map<K, V> | undefined
) => Dictionary<K, V>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L120)

### get (method)

Gets the value by the specified key of the current dictionary.

**Signature**

```ts
declare const get: (key: K) => V
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L45)

### set (method)

Sets the pair of the current dictionary.

**Signature**

```ts
declare const set: (key: K, value: V) => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L50)

### add (method)

Adds a new key to the current dictionary.

**Signature**

```ts
declare const add: (key: K, value: V) => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L55)

### clear (method)

Clears the current dictionary.

**Signature**

```ts
declare const clear: () => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L60)

### containsKey (method)

Determines if the key is in the current dictionary.

**Signature**

```ts
declare const containsKey: (key: K) => boolean
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L65)

### containsValue (method)

Determines if the value is in the current dictionary.

**Signature**

```ts
declare const containsValue: (value: V) => boolean
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L70)

### find (method)

Finds a key in the current dictionary and returns its index.

**Signature**

```ts
declare const find: (key: K) => number
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L75)

### remove (method)

Removes the given key from the current dictionary.

**Signature**

```ts
declare const remove: (key: K) => boolean
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L80)

### [Symbol.iterator] (method)

**Signature**

```ts
declare const [Symbol.iterator]: () => IterableIterator<[K, V]>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L84)

### toString (method)

**Signature**

```ts
declare const toString: () => string
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L91)

### toRecord (method)

**Signature**

```ts
declare const toRecord: (keys?: Array<K> | undefined) => Record<string, V>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L95)

## List (class)

**Signature**

```ts
declare class List<T>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L138)

Since v1.0.0

### lift (static method)

Lifts an Il2Cpp.Array to a List.

**Signature**

```ts
declare const lift: <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(object: Il2Cpp.Object) => List<T>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L223)

### of (static method)

Creates a new list with the given elements.

**Signature**

```ts
declare const of: <T extends Il2Cpp.Field.Type = Il2Cpp.Field.Type>(
  klass: Il2Cpp.Class,
  elements?: Array<T> | undefined
) => List<T>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L228)

### get (method)

Gets the value by the specified index of the current list.

**Signature**

```ts
declare const get: (index: number) => T
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L153)

### set (method)

Sets the element of the current list.

**Signature**

```ts
declare const set: (index: number, value: T) => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L158)

### add (method)

Adds a new element to the current list.

**Signature**

```ts
declare const add: (item: T) => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L163)

### clear (method)

Clears the current list.

**Signature**

```ts
declare const clear: () => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L168)

### contains (method)

Determines if the key is in the current list.

**Signature**

```ts
declare const contains: (item: T) => boolean
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L173)

### indexOf (method)

Determines the index of the element of the current list.

**Signature**

```ts
declare const indexOf: (item: T) => number
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L178)

### insert (method)

Inserts an element at the given index of the current list.

**Signature**

```ts
declare const insert: (index: number, item: T) => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L183)

### remove (method)

Removes a data element from the current list.

**Signature**

```ts
declare const remove: (item: T) => boolean
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L188)

### reverse (method)

Reverses the current list.

**Signature**

```ts
declare const reverse: () => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L193)

### sort (method)

Sorts the current list.

**Signature**

```ts
declare const sort: () => void
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L198)

### [Symbol.iterator] (method)

**Signature**

```ts
declare const [Symbol.iterator]: () => IterableIterator<T>
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L207)

### toString (method)

**Signature**

```ts
declare const toString: () => string
```

[Source](https://github.com/leonitousconforti/efffrida/packages/il2cpp-bridge/blob/main/src/Extensions.ts#L213)
