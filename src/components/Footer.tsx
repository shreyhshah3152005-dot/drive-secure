import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/carbazaar-logo.png" alt="CARBAZAAR Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gradient-primary">CAR</span>
                <span className="text-foreground">BAZAAR</span>
              </span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Your premier destination for luxury and performance vehicles. 
              We bring together the world's most prestigious automotive brands 
              under one roof.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/cars" className="text-muted-foreground hover:text-primary transition-colors">Our Collection</Link></li>
              <li><Link to="/dealers" className="text-muted-foreground hover:text-primary transition-colors">View Dealers</Link></li>
              <li><Link to="/dealer-auth" className="text-muted-foreground hover:text-primary transition-colors">Become a Dealer</Link></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">My Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                +91 6358766219
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                contact@carbazaar.com
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                Shop 1 Avenue Heights,<br />Vadodara, Gujarat - 390019
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CARBAZAAR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;