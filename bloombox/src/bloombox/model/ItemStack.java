package bloombox.model;

/**
 * Our own array-based stack of order lines (no ArrayList / java.util.Stack).
 * pop() is what makes "-1 = undo last flower item" work.
 */
public class ItemStack {
    private OrderLine[] data;
    private int top;

    public ItemStack() {
        this(4);
    }

    public ItemStack(int capacity) {
        this.data = new OrderLine[capacity];
        this.top = 0;
    }

    public void push(OrderLine line) {
        if (top == data.length) {
            OrderLine[] bigger = new OrderLine[data.length * 2];
            for (int i = 0; i < top; i++) {
                bigger[i] = data[i];
            }
            data = bigger;
        }
        data[top++] = line;
    }

    /** Removes and returns the last line, or null if the stack is empty. */
    public OrderLine pop() {
        if (isEmpty()) {
            return null;
        }
        OrderLine line = data[--top];
        data[top] = null;
        return line;
    }

    public OrderLine get(int index) {
        return data[index];
    }

    public int size() {
        return top;
    }

    public boolean isEmpty() {
        return top == 0;
    }
}
