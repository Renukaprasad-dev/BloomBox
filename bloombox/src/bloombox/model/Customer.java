package bloombox.model;

/** Abstract customer: every concrete type decides its own discount rate. */
public abstract class Customer extends Person {

    public Customer(String name) {
        super(name);
    }

    /** Discount as a fraction, e.g. 0.15 for 15%. */
    public abstract double getDiscountRate();

    public abstract String getType();

    /** Final: no subclass may change how the customer is described on a bill. */
    public final String describe() {
        return getName() + " (" + getType() + ")";
    }

    @Override
    public String toString() {
        return describe();
    }
}
