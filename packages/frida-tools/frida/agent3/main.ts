import * as Another from "./another.js";
import * as Other from "./other.js";

send(`Hello from Frida! ${Other.A} ${Another.A} ${Another.B}`);
