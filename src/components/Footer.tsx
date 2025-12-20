import { Car, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg gradient-gold">
                <Car className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gradient-gold">LUXE</span>
                <span className="text-foreground">MOTORS</span>
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
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Our Collection</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Book Test Drive</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Financing Options</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Trade-In</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                contact@luxemotors.com
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                123 Automotive Drive,<br />Beverly Hills, CA 90210
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LuxeMotors. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
