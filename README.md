# Lot.parser

``Lot`` stands for lots of things, like lots of tuples, or list of tuples.

Sometimes, we need to work with table or table-like data. For example, you are
writing a dozen of Chinese sentences and their corresponding translations. It
is a nightmare to mark every pair of sentences explicitly, it would be better
to have:

```
mainDataSet as [cmn, eng] =
---
我在吃东西。
I am eating.
---
我在整理东西。
I am sorting things.
---
我丢了东西。
I lost something.
---
```

Then, with a simple script, it can be compiled to JSON. That's ``Lot``.

```JSON
{
  "mainDataSet" = [
  {
    "cmn": "我在吃东西。",
    "eng": "I am eating."
  },
  {
    "cmn": "我在整理东西。",
    "eng": "I am sorting things."
  },
  {
    "cmn": "我丢了东西。",
    "eng": "I lost something."
  }
  ]
}
```

## Syntax

Lot's syntax is simple, as shown above. It doesn't support complicated tuple
since you can do further transformation based on compilation result. The last
delimiter after a data definition can be omitted. It is there for visual
consistence.

You can reuse type by explict definition:

```
define Pair as [cmn, eng]
mainDataSet as Pair =
---
我在吃东西。
I am eating.
---
```

Sometimes you just want an array of sentences, so use the following syntax:

```
toEng as [...] =
---
我在吃东西。
我丢了东西。
我在整理东西。
---
```

You can also omit a field:

```
mainDataSet as Pair =
---
我在吃。
?
---
```

You will get ``null`` in the output JSON.

## Status

Lot.parser is at early development which may be ceased since I switch to YAML.

It is developed for IOL.cn.

It cannot handle error gracefully now. I am a newbee at parsing techniques.
