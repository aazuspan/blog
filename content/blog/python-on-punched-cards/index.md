+++
title = "Python on Punched Cards"
date = "2024-08-22"
description = "Write Python like it's 1959 by encoding it onto IBM 1401 punched cards."
tags = ["python", "algorithms"]
aliases = ["/blog/python_punchcards"]
+++

Before AI assistants, modern IDEs, syntax highlighting, and version control, software was written by making holes in pieces of paper called punched cards. I've read the horror stories from this era - about waiting all day for a university computer to run your program just to find out one card was backwards, about repunching a card because you hit a wrong key on the keypunch machine, about reassembling an entire Fortran program line by line after dropping a deck of cards on the ground. But other than some educated guesses about binary encoding, I've never understood *how* a computer program turns into a stack of punched cards.

{{<figure src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/FortranCardPROJ039.agr.jpg/512px-FortranCardPROJ039.agr.jpg?20100721181341" alt="Fortran punched card" caption="One line of Fortran code on a punched card.">}}

So I decided to figure out by writing an encoder that would do just that, converting modern Python code to early 1950s punched cards.

## Punched Card Encoding

The basic principle behind punched cards is easy to guess. Computers speak in 1s and 0s. A piece of paper can have a hole (1) or not (0). So, a punched card is just a binary representation of code. But how do we convert code into binary?

### Bits of Paper

My first guess was that we get the ASCII encoding of each character (who needs unicode?) and punch holes for all the 1s, but it turns out it's not that simple. Punched cards were developed well before computers, as a way to record numeric data for the 1890 US Census. Most early punched cards had 10 rows[^row-column], and decimal numbers were recorded by punching a hole in the correct digit 0-9. 

By the time computers adopted punched card technology in the early 1950s, it had expanded to include 12 rows that could encode decimal digits, uppercase letters, or special characters like punctuation and operators. With one character per column and 80 columns[^80-columns], each punch card could encode a single line of code.

So, how do you encode a number, letter, or character in 12 bits without using ASCII[^no-ascii]?

### IBMs and BCDs

Early computing hardware and software was a mess of proprietary and incompatible standards and protocols, and punched card encoding was no different. Encodings would vary computer to computer, meaning that a card punched for one IBM machine could be unusable on another IBM. 

There were *some* common characteristics between encoding systems though, which allowed many systems to be represented as binary-encoded decimal, or BCD. A BCD maps each supported character to 6 bits. The first two bits describe which of the "zone" rows (none, 12, 11, or 10[^row-10]) is punched, while the last four bits describe which of the digit rows (none, or 1 - 9) is punched.

{{<figure src="ibm1401_bcd.png" caption="The character encoding table for IBM 1401 BCD.">}}

In the [IBM 1401 BCD system](https://en.wikipedia.org/wiki/BCD_(character_encoding)#IBM_1401_BCD_code) above (which I'll be using to encode Python[^ibm-1401]), the number 1 has the hex encoding `01`, which translates to a binary encoding `00 0001`. The first two bits tell us that no zone row is punched, and the last four bits tell us that the first digit row (1) is punched. Just like the original census punched cards of 1890, all the digits 1-9 simply encode to their corresponding row.

Things get a little more complicated with uppercase letters, which each require a single zone encoding. For example, `A` has the hex encoding `31` and binary encoding `11 0001`, which means we punch the third zone row (10) and the first digit row (1).

You might notice that once we get into the special characters like `#`, which encodes to `0B` or `00 1100` (no zone row, digit row 12) we've run out of digit rows. IBM 1401 handles that by punching a new hole at digit row 8 to indicate a special character, and starting the digit rows over at 2-7. Therefore, `00 1100` *actually* encodes to a hole at row 3 and row 8.

## Punched Python

To convert a Python program into a deck of IBM 1401 punched cards, we'll loop over each character in each line of source code, encoding it into a list of punched row numbers. Encoding a character is a matter of finding its hexadecimal representation in the encoding table and parsing that into the appropriate rows to punch, taking care to handle special characters as needed. 

For example, to encode the letter `P`, we look up its hex encoding (27), convert that into binary (100111), and punch the appropriate zone row (11) and digit row (7). Repeat that process for the rest of the line and we can encode `print('hello world')` as:

```text
12      ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️
11      ◻️ ◻️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◻️ ◻️ ◼️ ◼️ ◻️ ◻️ ◻️ ◼️ ◼️ ◻️
10      ◼️ ◼️ ◻️ ◼️ ◼️ ◻️ ◼️ ◻️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️
1       ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️
2       ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️
3       ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️ ◻️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️ ◼️
4       ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️
5       ◼️ ◼️ ◼️ ◻️ ◼️ ◻️ ◼️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️
6       ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◻️ ◻️ ◼️ ◼️ ◼️ ◻️ ◼️
7       ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️
8       ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◻️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◻️
9       ◼️ ◻️ ◻️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◼️ ◻️ ◼️ ◼️ ◼️ ◼️
```

Repeat the process for every line in your program and you get a deck of punched cards, ready to print out and take to your nearest IBM mainframe!

You can see the [full code here](https://github.com/aazuspan/punchcard-python) and run it on your own Python programs.

## Next Steps

Now that we've got Python encoded onto punched cards, the next logical step is to decode punched cards back into Python and run them. I've got a few ideas how we could do that with some fiducials and computer vision, but I'll save that for another time.

[^row-column]: I've noticed that row and column terminology is sometimes flipped, depending on the source. For consistency, I'm referring to a column as the 12 bits that encode a single character. If you held the punched card upright, it would be 80 columns wide and 12 rows tall.

[^80-columns]: Many punched card readers only read 72 of the 80 columns, leaving the rest available for clever tricks like adding comment characters so that you could comment out a line by flipping it over.

[^no-ascii]: While ASCII *could* encode a character in just 7 bits instead of 12, it wasn't introduced until 10 years after the first punched card computer, and it turns out there are some good reasons to not use ASCII. 12-row encodings were designed to maximize card integrity by punching as few holes as possible, and rarely punching adjacent rows. Encoding `=` in ASCII would require punching 6 of the 7 rows, compared to just 2 rows in IBM 1401.

[^row-10]: Confusingly, row 10 is also sometimes referred to as row 0, depending on the encoding system and the context.

[^ibm-1401]: IBM 1401 BCD supports *most* of the characters we'll need to encode a Python program. I replaced a few unused characters with some critical missing characters like underscores and square/curly brackets, but ran out of room to fit a `+` sign. You can always just subtract a negative number instead, right? Also, we have no lowercase letters.