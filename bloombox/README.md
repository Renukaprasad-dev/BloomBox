# BloomBox

Menu-driven Java 17 console billing program for the flower shop (Hackathon Problem 22).

## Build and run

```
mkdir -p out
javac -d out $(find src -name '*.java')
java -cp out bloombox.app.BloomBox
```

## Layout

| Package | Classes |
|---|---|
| `bloombox.app` | `BloomBox` (menu, input handling, reports) |
| `bloombox.model` | `Person` -> abstract `Customer` -> `Regular` / `EventPlanner`; `Billable`; `FlowerItem`; `Order`; `OrderLine`; `ItemStack` (own array stack for undo) |
| `bloombox.exceptions` | `FlowerItemNotFoundException`, `InsufficientStockException` (both checked) |

## Where each syllabus point lives

- Unit I: `FlowerItem[]` / `Order[]` in `BloomBox`; `final double GST` in `Order`; `?:` for LOW/OK in `FlowerItem.getStatus()`; `token & 1` in `Order.getRider()`; `(int)` cast in `Order.toString()`.
- Unit II: do-while + switch menu in `BloomBox.main`.
- Unit III: constructors with `this`; overloaded `Order.subtotal()` / `subtotal(int)` and `addLine(...)`; static `Order.counter`; recursive `subtotal(int)`; `ItemStack` for `-1` undo.
- Unit IV: packages, `super(name)`, overridden `getDiscountRate()`, `Billable`, `final describe()` in `Customer`, `toString()`.
- Unit V: `throw` in `findItem` / `addLine`, multi-catch, nested try, `finally`, try-with-resources on `Scanner`.

## Design notes

- Stock is only reduced when an order is confirmed, so a rejected line never changes stock. A line that fails (unknown id or too much quantity) is skipped and the florist can keep entering items.
- Quantity already in the current order is counted when checking stock, so adding the same item twice cannot exceed stock.
- Order ids and tokens are only handed out for confirmed orders; an empty order is discarded.
- Money is shown as `Rs.` to avoid console encoding problems with the rupee sign.
