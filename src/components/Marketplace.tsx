import { ShoppingCart, Package, Search, Filter, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: string;
  rating: number;
  recommended?: boolean;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Dental Mirror Set (12 pcs)",
    category: "Tools",
    price: 45.99,
    stock: "In Stock",
    rating: 4.8,
    recommended: true
  },
  {
    id: "2",
    name: "Ultrasonic Scaler Tips",
    category: "Tools",
    price: 89.99,
    stock: "In Stock",
    rating: 4.6,
    recommended: true
  },
  {
    id: "3",
    name: "Composite Filling Material",
    category: "Materials",
    price: 125.00,
    stock: "In Stock",
    rating: 4.9
  },
  {
    id: "4",
    name: "Surgical Gloves (Box of 100)",
    category: "Consumables",
    price: 24.99,
    stock: "In Stock",
    rating: 4.7
  },
  {
    id: "5",
    name: "LED Curing Light",
    category: "Equipment",
    price: 299.99,
    stock: "Low Stock",
    rating: 4.5
  },
  {
    id: "6",
    name: "Anesthetic Cartridges (50 pcs)",
    category: "Medicines",
    price: 79.99,
    stock: "In Stock",
    rating: 4.8
  },
];

const mockOrders = [
  {
    id: "ORD-001",
    date: "2024-10-25",
    items: "Dental Mirror Set, Surgical Gloves",
    total: 70.98,
    status: "Delivered"
  },
  {
    id: "ORD-002",
    date: "2024-10-20",
    items: "Composite Filling Material",
    total: 125.00,
    status: "In Transit"
  },
];

export function Marketplace() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dentistry Product Marketplace</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Cart (3)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Shopping Cart</DialogTitle>
                  <DialogDescription>
                    Review your items before checkout
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dental Mirror Set</p>
                      <p className="text-sm text-muted-foreground">Qty: 2</p>
                    </div>
                    <p className="font-medium">$91.98</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Surgical Gloves</p>
                      <p className="text-sm text-muted-foreground">Qty: 1</p>
                    </div>
                    <p className="font-medium">$24.99</p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Total</p>
                      <p className="font-medium">$116.97</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Continue Shopping</Button>
                  <Button className="bg-primary hover:bg-primary/90">Proceed to Checkout</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
                <SelectItem value="materials">Materials</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="medicines">Medicines</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Browse Catalog</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="products" className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-3 gap-4 pr-4">
                  {mockProducts.map((product) => (
                    <Card key={product.id} className="hover:bg-[var(--hover)] transition-colors">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                          
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium line-clamp-2">{product.name}</h4>
                              {product.recommended && (
                                <Badge className="bg-secondary hover:bg-secondary shrink-0">
                                  <TrendingUp className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{product.rating}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-medium">${product.price}</p>
                              <Badge
                                variant="outline"
                                className={
                                  product.stock === "In Stock"
                                    ? "text-green-600 border-green-600"
                                    : "text-yellow-600 border-yellow-600"
                                }
                              >
                                {product.stock}
                              </Badge>
                            </div>
                          </div>
                          
                          <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="recommended">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center shrink-0">
                          <Package className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Based on your recent treatments</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Patients with root canal treatments often need these products
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Badge>Dental Files</Badge>
                            <Badge>Gutta Percha</Badge>
                            <Badge>Sealer</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {mockProducts
                      .filter((p) => p.recommended)
                      .map((product) => (
                        <Card key={product.id} className="hover:bg-[var(--hover)] transition-colors">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                              
                              <div>
                                <h4 className="font-medium line-clamp-2">{product.name}</h4>
                                <p className="text-sm text-muted-foreground">{product.category}</p>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{product.rating}</span>
                              </div>
                              
                              <p className="text-lg font-medium">${product.price}</p>
                              
                              <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                                Quick Order
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="orders">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {mockOrders.map((order) => (
                    <Card key={order.id} className="hover:bg-[var(--hover)] transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">Order {order.id}</h4>
                              <Badge
                                className={
                                  order.status === "Delivered"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Ordered on {new Date(order.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm">{order.items}</p>
                            <p className="text-lg font-medium">${order.total.toFixed(2)}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline">
                              Track Order
                            </Button>
                            <Button size="sm" variant="outline">
                              Reorder
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
