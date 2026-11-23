package bloombox.model;

public class Regular extends Customer {

    public Regular(String name) {
        super(name);
    }

    @Override
    public double getDiscountRate() {
        return 0.0;
    }

    @Override
    public String getType() {
        return "Regular";
    }
}
