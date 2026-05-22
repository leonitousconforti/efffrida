---
"@efffrida/vitest-pool": patch
---

QuickJS returns Error.stack as a boxed String object, not a primitive. This
causes @vitest/utils serializeValue to walk it as a char-indexed object
{"0":"A","1":"s",...}. Adding toJSON makes serializeValue call valueOf()
instead, returning the primitive string.

```typescript
if (!("toJSON" in String.prototype)) {
    (String.prototype as any).toJSON = String.prototype.valueOf;
}
```
