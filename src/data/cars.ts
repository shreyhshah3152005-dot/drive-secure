export interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  horsepower: number;
  acceleration: string;
  topSpeed: string;
  image: string;
  description: string;
  features: string[];
  category: string;
}

export const cars: Car[] = [
  {
    id: "1",
    name: "Porsche 911 Carrera",
    brand: "Porsche",
    model: "911 Carrera",
    year: 2024,
    price: 115400,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed PDK",
    horsepower: 379,
    acceleration: "4.0s (0-60)",
    topSpeed: "182 mph",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    description: "The iconic 911 Carrera delivers timeless design with cutting-edge performance. A rear-engine sports car that defines automotive excellence.",
    features: ["Sport Chrono Package", "PASM Sport Suspension", "Bose Surround Sound", "LED Matrix Headlights"],
    category: "Sports"
  },
  {
    id: "2",
    name: "Mercedes-AMG GT",
    brand: "Mercedes-Benz",
    model: "AMG GT",
    year: 2024,
    price: 138000,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "9-speed AMG Speedshift",
    horsepower: 523,
    acceleration: "3.7s (0-60)",
    topSpeed: "196 mph",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    description: "Handcrafted AMG 4.0L V8 biturbo engine delivers breathtaking performance with unmistakable Mercedes luxury.",
    features: ["AMG Performance Exhaust", "Nappa Leather Interior", "Burmester 3D Sound", "AMG Ride Control"],
    category: "Sports"
  },
  {
    id: "3",
    name: "BMW M4 Competition",
    brand: "BMW",
    model: "M4 Competition",
    year: 2024,
    price: 84900,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed M Steptronic",
    horsepower: 503,
    acceleration: "3.8s (0-60)",
    topSpeed: "180 mph",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    description: "The ultimate driving machine. M TwinPower Turbo inline 6-cylinder engine with racing DNA in every detail.",
    features: ["M Carbon Bucket Seats", "M Drive Professional", "M Carbon Ceramic Brakes", "Harman Kardon Audio"],
    category: "Sports"
  },
  {
    id: "4",
    name: "Audi RS7 Sportback",
    brand: "Audi",
    model: "RS7 Sportback",
    year: 2024,
    price: 128900,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed Tiptronic",
    horsepower: 621,
    acceleration: "3.5s (0-60)",
    topSpeed: "190 mph",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    description: "Where performance meets versatility. The RS7 combines explosive power with everyday practicality and stunning design.",
    features: ["Quattro Sport Differential", "RS Adaptive Air Suspension", "Bang & Olufsen 3D Sound", "Matrix LED Headlights"],
    category: "Gran Turismo"
  },
  {
    id: "5",
    name: "Range Rover Sport",
    brand: "Land Rover",
    model: "Range Rover Sport",
    year: 2024,
    price: 89900,
    mileage: 0,
    fuelType: "Hybrid",
    transmission: "8-speed Automatic",
    horsepower: 395,
    acceleration: "5.8s (0-60)",
    topSpeed: "150 mph",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
    description: "Refined luxury meets all-terrain capability. The Range Rover Sport delivers exceptional comfort on any surface.",
    features: ["Terrain Response 2", "Meridian Sound System", "Air Suspension", "Panoramic Roof"],
    category: "SUV"
  },
  {
    id: "6",
    name: "Tesla Model S Plaid",
    brand: "Tesla",
    model: "Model S Plaid",
    year: 2024,
    price: 89990,
    mileage: 0,
    fuelType: "Electric",
    transmission: "Single-speed",
    horsepower: 1020,
    acceleration: "1.99s (0-60)",
    topSpeed: "200 mph",
    image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&q=80",
    description: "The quickest production car ever made. Tri-motor all-wheel drive with unprecedented acceleration.",
    features: ["Full Self-Driving Capability", "Yoke Steering", "22-Speaker Audio", "Gaming Computer"],
    category: "Electric"
  },
  {
    id: "7",
    name: "Lamborghini Huracán",
    brand: "Lamborghini",
    model: "Huracán EVO",
    year: 2024,
    price: 261274,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "7-speed LDF",
    horsepower: 631,
    acceleration: "2.9s (0-60)",
    topSpeed: "202 mph",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
    description: "Pure Italian supercar excellence. The naturally aspirated V10 delivers an unforgettable driving experience.",
    features: ["LDVI System", "Magneto Rheological Suspension", "Performance Traction Control", "Alcantara Interior"],
    category: "Supercar"
  },
  {
    id: "8",
    name: "Bentley Continental GT",
    brand: "Bentley",
    model: "Continental GT",
    year: 2024,
    price: 235525,
    mileage: 0,
    fuelType: "Petrol",
    transmission: "8-speed DCT",
    horsepower: 650,
    acceleration: "3.5s (0-60)",
    topSpeed: "208 mph",
    image: "https://images.unsplash.com/photo-1621135802920-133df287f89c?w=800&q=80",
    description: "The definitive grand tourer. Handcrafted luxury with a W12 engine that delivers effortless power.",
    features: ["Naim Audio System", "Diamond Quilted Leather", "Rotating Display", "48V Active Anti-Roll"],
    category: "Grand Tourer"
  }
];
