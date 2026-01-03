import { Check, Star, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
  description: string;
  features: {
    listings: string;
    support: string;
    featured: string;
    extras: string[];
  };
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 999,
    icon: <Star className="w-6 h-6" />,
    description: "Perfect for individual sellers",
    features: {
      listings: "5 car listings",
      support: "Email support",
      featured: "No featured placement",
      extras: [
        "Basic analytics",
        "Standard listing duration (30 days)",
        "Photo gallery (up to 5 images)",
      ],
    },
  },
  {
    id: "standard",
    name: "Standard",
    price: 1999,
    icon: <Zap className="w-6 h-6" />,
    description: "Best for small dealers",
    features: {
      listings: "20 car listings",
      support: "Phone & Email support",
      featured: "Weekly featured placement",
      extras: [
        "Advanced analytics",
        "Extended listing duration (60 days)",
        "Photo gallery (up to 15 images)",
        "Video upload support",
        "Priority in search results",
      ],
    },
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 3999,
    icon: <Crown className="w-6 h-6" />,
    description: "For established dealerships",
    features: {
      listings: "Unlimited car listings",
      support: "Dedicated account manager",
      featured: "Always featured placement",
      extras: [
        "Full analytics dashboard",
        "Unlimited listing duration",
        "Unlimited photos & videos",
        "Top priority in search",
        "Custom branding on listings",
        "Lead generation tools",
        "API access",
        "Multi-user accounts",
      ],
    },
  },
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string) => void;
}

const SubscriptionPlans = ({ currentPlan, onSelectPlan }: SubscriptionPlansProps = {}) => {
  const handleSelectPlan = (plan: Plan) => {
    if (onSelectPlan) {
      onSelectPlan(plan.id);
    } else {
      toast.info(`To upgrade to ${plan.name}, please contact our admin team.`);
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your <span className="text-gradient-primary">Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the perfect subscription to showcase your vehicles and grow your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? "border-primary shadow-primary ring-2 ring-primary/20"
                  : "border-border/50 hover:border-primary/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div
                  className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                    plan.popular
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">₹{plan.price.toLocaleString("en-IN")}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{plan.features.listings}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{plan.features.support}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{plan.features.featured}</span>
                  </div>
                  {plan.features.extras.map((extra, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{extra}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? "Current Plan" : plan.popular ? "Get Started" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All prices are in Indian Rupees (₹). GST extra as applicable.
        </p>
      </div>
    </section>
  );
};

export default SubscriptionPlans;