package bloombox.model;

public class EventPlanner extends Customer {

    public EventPlanner(String name) {
        super(name);
    }

    @Override
    public double getDiscountRate() {
        return 0.15;
    }

    @Override
    public String getType() {
        return "Event Planner";
    }
}
