#!/usr/bin/env python3
"""Simple greeting script"""

def greet(name):
    return f"Hello, {name}!"

def main():
    names = ["Alice", "Bob", "Charlie"]
    for name in names:
        print(greet(name))

if __name__ == "__main__":
    main()

