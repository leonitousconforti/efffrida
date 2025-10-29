import * as Another from "./another.agent.ts";
import * as Other from "./other.agent.ts";

send(`Hello from Frida! ${Other.A} ${Another.A} ${Another.B}`);
