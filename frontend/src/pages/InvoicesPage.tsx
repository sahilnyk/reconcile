import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, type InvoiceSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useFileUpload, formatBytes, type FileWithPreview } from "@/components/ui/file-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  Upload,
  AlertTriangle,
  Search,
  Filter,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile extends FileWithPreview {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const DEMO_INVOICES = [
  {
    name: 'RET-001_HUL.txt',
    content: `INVOICE

Invoice Number: RET-001
Vendor: Hindustan Unilever Limited
Invoice Date: 05-01-2024
Due Date: 05-02-2024
Currency: INR

Items:
- Surf Excel Detergent 1kg (Qty: 50 packs, Unit Price: Rs.120, Total: Rs.6,000)
- Lifebuoy Soap (Qty: 100 bars, Unit Price: Rs.35, Total: Rs.3,500)
- Sunsilk Shampoo (Qty: 48 bottles, Unit Price: Rs.95, Total: Rs.4,560)
- Closeup Toothpaste (Qty: 72 tubes, Unit Price: Rs.55, Total: Rs.3,960)

Subtotal: Rs.18,020
GST (18%): Rs.3,244
Total: Rs.21,264`
  },
  {
    name: 'RET-002_Britannia.txt',
    content: `INVOICE

Invoice Number: RET-002
Vendor: Britannia Industries
Invoice Date: 12-01-2024
Due Date: 12-02-2024
Currency: INR

Items:
- Good Day Biscuits (Qty: 120 packs, Unit Price: Rs.15, Total: Rs.1,800)
- Tiger Biscuits (Qty: 100 packs, Unit Price: Rs.10, Total: Rs.1,000)
- Marie Gold (Qty: 80 packs, Unit Price: Rs.25, Total: Rs.2,000)
- Milk Bikis (Qty: 60 packs, Unit Price: Rs.30, Total: Rs.1,800)
- Cake Rusk (Qty: 40 packs, Unit Price: Rs.45, Total: Rs.1,800)

Subtotal: Rs.8,400
GST (18%): Rs.1,512
Total: Rs.9,912`
  },
  {
    name: 'RET-003_ITC.txt',
    content: `INVOICE

Invoice Number: RET-003
Vendor: ITC Limited
Invoice Date: 18-01-2024
Due Date: 18-02-2024
Currency: INR

Items:
- Aashirvaad Atta 5kg (Qty: 30 bags, Unit Price: Rs.245, Total: Rs.7,350)
- Sunflower Oil 1L (Qty: 48 bottles, Unit Price: Rs.145, Total: Rs.6,960)
- YiPPee Noodles (Qty: 100 packs, Unit Price: Rs.15, Total: Rs.1,500)
- Bingo Chips (Qty: 60 packs, Unit Price: Rs.20, Total: Rs.1,200)
- Classmate Notebooks (Qty: 100 pcs, Unit Price: Rs.45, Total: Rs.4,500)

Subtotal: Rs.21,510
GST (18%): Rs.3,872
Total: Rs.25,382`
  },
  {
    name: 'RET-004_Nestle.txt',
    content: `INVOICE

Invoice Number: RET-004
Vendor: Nestle India
Invoice Date: 22-01-2024
Due Date: 22-02-2024
Currency: INR

Items:
- Maggi Noodles (Qty: 150 packs, Unit Price: Rs.14, Total: Rs.2,100)
- Nescafe Coffee (Qty: 24 jars, Unit Price: Rs.185, Total: Rs.4,440)
- Everyday Milk Powder (Qty: 20 packs, Unit Price: Rs.245, Total: Rs.4,900)
- KitKat (Qty: 80 bars, Unit Price: Rs.25, Total: Rs.2,000)
- Munch (Qty: 100 bars, Unit Price: Rs.10, Total: Rs.1,000)

Subtotal: Rs.14,440
GST (18%): Rs.2,599
Total: Rs.17,039`
  },
  {
    name: 'RET-005_Amul.txt',
    content: `INVOICE

Invoice Number: RET-005
Vendor: Amul Dairy
Invoice Date: 28-01-2024
Due Date: 28-02-2024
Currency: INR

Items:
- Amul Butter 500g (Qty: 40 packs, Unit Price: Rs.250, Total: Rs.10,000)
- Amul Milk 1L (Qty: 100 packs, Unit Price: Rs.68, Total: Rs.6,800)
- Amul Cheese Slices (Qty: 30 packs, Unit Price: Rs.145, Total: Rs.4,350)
- Amul Ice Cream 1L (Qty: 24 tubs, Unit Price: Rs.180, Total: Rs.4,320)

Subtotal: Rs.25,470
GST (12%): Rs.3,056
Total: Rs.28,526`
  },
  {
    name: 'RET-006_Dabur.txt',
    content: `INVOICE

Invoice Number: RET-006
Vendor: Dabur India
Invoice Date: 05-02-2024
Due Date: 05-03-2024
Currency: INR

Items:
- Dabur Honey 500g (Qty: 24 bottles, Unit Price: Rs.215, Total: Rs.5,160)
- Chyawanprash 1kg (Qty: 20 jars, Unit Price: Rs.285, Total: Rs.5,700)
- Dabur Red Paste (Qty: 48 tubes, Unit Price: Rs.65, Total: Rs.3,120)
- Amla Hair Oil (Qty: 36 bottles, Unit Price: Rs.95, Total: Rs.3,420)
- Glucose D (Qty: 30 packs, Unit Price: Rs.55, Total: Rs.1,650)

Subtotal: Rs.19,050
GST (18%): Rs.3,429
Total: Rs.22,479`
  },
  {
    name: 'RET-007_Parle.txt',
    content: `INVOICE

Invoice Number: RET-007
Vendor: Parle Products
Invoice Date: 10-02-2024
Due Date: 10-03-2024
Currency: INR

Items:
- Parle-G Biscuits (Qty: 200 packs, Unit Price: Rs.5, Total: Rs.1,000)
- Monaco Biscuits (Qty: 100 packs, Unit Price: Rs.20, Total: Rs.2,000)
- Hide & Seek (Qty: 60 packs, Unit Price: Rs.35, Total: Rs.2,100)
- 20-20 Cookies (Qty: 80 packs, Unit Price: Rs.25, Total: Rs.2,000)
- KrackJack (Qty: 100 packs, Unit Price: Rs.15, Total: Rs.1,500)

Subtotal: Rs.8,600
GST (18%): Rs.1,548
Total: Rs.10,148`
  },
  {
    name: 'RET-008_CocaCola.txt',
    content: `INVOICE

Invoice Number: RET-008
Vendor: Coca-Cola India
Invoice Date: 15-02-2024
Due Date: 15-03-2024
Currency: INR

Items:
- Coke 750ml (Qty: 48 bottles, Unit Price: Rs.40, Total: Rs.1,920)
- Sprite 750ml (Qty: 48 bottles, Unit Price: Rs.40, Total: Rs.1,920)
- Thums Up 750ml (Qty: 48 bottles, Unit Price: Rs.40, Total: Rs.1,920)
- Maaza 1L (Qty: 24 bottles, Unit Price: Rs.65, Total: Rs.1,560)
- Kinley Water 1L (Qty: 48 bottles, Unit Price: Rs.20, Total: Rs.960)

Subtotal: Rs.8,280
GST (28%): Rs.2,318
Total: Rs.10,598`
  },
  {
    name: 'RET-009_PG.txt',
    content: `INVOICE

Invoice Number: RET-009
Vendor: Procter & Gamble
Invoice Date: 20-02-2024
Due Date: 20-03-2024
Currency: INR

Items:
- Ariel Detergent (Qty: 36 packs, Unit Price: Rs.175, Total: Rs.6,300)
- Tide Plus (Qty: 40 packs, Unit Price: Rs.125, Total: Rs.5,000)
- Whisper Pads (Qty: 60 packs, Unit Price: Rs.85, Total: Rs.5,100)
- Pampers Small (Qty: 24 packs, Unit Price: Rs.195, Total: Rs.4,680)
- Gillette Razors (Qty: 20 packs, Unit Price: Rs.245, Total: Rs.4,900)

Subtotal: Rs.25,980
GST (18%): Rs.4,676
Total: Rs.30,656`
  },
  {
    name: 'RET-010_Marico.txt',
    content: `INVOICE

Invoice Number: RET-010
Vendor: Marico Limited
Invoice Date: 25-02-2024
Due Date: 25-03-2024
Currency: INR

Items:
- Parachute Oil 500ml (Qty: 48 bottles, Unit Price: Rs.135, Total: Rs.6,480)
- Saffola Oil 1L (Qty: 36 bottles, Unit Price: Rs.165, Total: Rs.5,940)
- Set Wet Gel (Qty: 30 packs, Unit Price: Rs.75, Total: Rs.2,250)
- Livon Serum (Qty: 24 bottles, Unit Price: Rs.95, Total: Rs.2,280)
- Revive Soap (Qty: 60 bars, Unit Price: Rs.25, Total: Rs.1,500)

Subtotal: Rs.18,450
GST (18%): Rs.3,321
Total: Rs.21,771`
  },
  {
    name: 'RET-011_PepsiCo.txt',
    content: `INVOICE

Invoice Number: RET-011
Vendor: PepsiCo India
Invoice Date: 05-03-2024
Due Date: 05-04-2024
Currency: INR

Items:
- Pepsi 750ml (Qty: 48 pcs, Unit Price: Rs.38, Total: Rs.1824)
- Mirinda 750ml (Qty: 36 pcs, Unit Price: Rs.38, Total: Rs.1368)
- 7UP 750ml (Qty: 36 pcs, Unit Price: Rs.38, Total: Rs.1368)
- Doritos Nachos (Qty: 40 pcs, Unit Price: Rs.45, Total: Rs.1800)
- Lays Chips (Qty: 60 pcs, Unit Price: Rs.25, Total: Rs.1500)

Subtotal: Rs.7860
GST (18%): Rs.1415
Total: Rs.9275`
  },
  {
    name: 'RET-012_Mondelez.txt',
    content: `INVOICE

Invoice Number: RET-012
Vendor: Mondelez India
Invoice Date: 10-03-2024
Due Date: 10-04-2024
Currency: INR

Items:
- Dairy Milk 100g (Qty: 100 pcs, Unit Price: Rs.80, Total: Rs.8000)
- Cadbury 5 Star (Qty: 80 pcs, Unit Price: Rs.25, Total: Rs.2000)
- Oreo Biscuits (Qty: 60 pcs, Unit Price: Rs.35, Total: Rs.2100)
- Bournville (Qty: 40 pcs, Unit Price: Rs.90, Total: Rs.3600)
- Gems (Qty: 50 pcs, Unit Price: Rs.20, Total: Rs.1000)

Subtotal: Rs.16700
GST (18%): Rs.3006
Total: Rs.19706`
  },
  {
    name: 'RET-013_Godrej.txt',
    content: `INVOICE

Invoice Number: RET-013
Vendor: Godrej Consumer
Invoice Date: 15-03-2024
Due Date: 15-04-2024
Currency: INR

Items:
- Cinthol Soap (Qty: 60 pcs, Unit Price: Rs.35, Total: Rs.2100)
- Godrej Hair Color (Qty: 30 pcs, Unit Price: Rs.140, Total: Rs.4200)
- Good Knight Refill (Qty: 40 pcs, Unit Price: Rs.85, Total: Rs.3400)
- Hit Spray (Qty: 30 pcs, Unit Price: Rs.120, Total: Rs.3600)
- Ezee Liquid (Qty: 24 pcs, Unit Price: Rs.75, Total: Rs.1800)

Subtotal: Rs.15100
GST (18%): Rs.2718
Total: Rs.17818`
  },
  {
    name: 'RET-014_Patanjali.txt',
    content: `INVOICE

Invoice Number: RET-014
Vendor: Patanjali Ayurved
Invoice Date: 20-03-2024
Due Date: 20-04-2024
Currency: INR

Items:
- Patanjali Ghee 1L (Qty: 30 pcs, Unit Price: Rs.550, Total: Rs.16500)
- Dant Kanti Paste (Qty: 48 pcs, Unit Price: Rs.85, Total: Rs.4080)
- Aloe Vera Gel (Qty: 36 pcs, Unit Price: Rs.85, Total: Rs.3060)
- Divya Chyawanprash (Qty: 24 pcs, Unit Price: Rs.260, Total: Rs.6240)
- Cow Milk Powder (Qty: 20 pcs, Unit Price: Rs.380, Total: Rs.7600)

Subtotal: Rs.37480
GST (12%): Rs.4498
Total: Rs.41978`
  },
  {
    name: 'RET-015_Tata.txt',
    content: `INVOICE

Invoice Number: RET-015
Vendor: Tata Consumer
Invoice Date: 25-03-2024
Due Date: 25-04-2024
Currency: INR

Items:
- Tata Tea Premium (Qty: 50 pcs, Unit Price: Rs.285, Total: Rs.14250)
- Tata Coffee (Qty: 30 pcs, Unit Price: Rs.195, Total: Rs.5850)
- Tata Salt 1kg (Qty: 60 pcs, Unit Price: Rs.28, Total: Rs.1680)
- Tata Sampann Dal (Qty: 40 pcs, Unit Price: Rs.145, Total: Rs.5800)
- Tata Soulfull (Qty: 30 pcs, Unit Price: Rs.120, Total: Rs.3600)

Subtotal: Rs.31180
GST (12%): Rs.3742
Total: Rs.34922`
  },
  {
    name: 'RET-016_Unibic.txt',
    content: `INVOICE

Invoice Number: RET-016
Vendor: Unibic Biscuits
Invoice Date: 01-04-2024
Due Date: 01-05-2024
Currency: INR

Items:
- Unibic Cookies (Qty: 80 pcs, Unit Price: Rs.45, Total: Rs.3600)
- Snap Snacks (Qty: 60 pcs, Unit Price: Rs.35, Total: Rs.2100)
- Butter Cookies (Qty: 50 pcs, Unit Price: Rs.55, Total: Rs.2750)
- Choco Chip (Qty: 40 pcs, Unit Price: Rs.65, Total: Rs.2600)
- Fruit Biscuits (Qty: 50 pcs, Unit Price: Rs.40, Total: Rs.2000)

Subtotal: Rs.13050
GST (18%): Rs.2349
Total: Rs.15399`
  },
  {
    name: 'RET-017_Haldirams.txt',
    content: `INVOICE

Invoice Number: RET-017
Vendor: Haldirams
Invoice Date: 05-04-2024
Due Date: 05-05-2024
Currency: INR

Items:
- Bhujia 400g (Qty: 40 pcs, Unit Price: Rs.120, Total: Rs.4800)
- Moong Dal (Qty: 30 pcs, Unit Price: Rs.95, Total: Rs.2850)
- Aloo Bhujia (Qty: 36 pcs, Unit Price: Rs.85, Total: Rs.3060)
- Soan Papdi (Qty: 24 pcs, Unit Price: Rs.150, Total: Rs.3600)
- Mini Samosa (Qty: 30 pcs, Unit Price: Rs.95, Total: Rs.2850)

Subtotal: Rs.17160
GST (12%): Rs.2059
Total: Rs.19219`
  },
  {
    name: 'RET-018_MTR.txt',
    content: `INVOICE

Invoice Number: RET-018
Vendor: MTR Foods
Invoice Date: 10-04-2024
Due Date: 10-05-2024
Currency: INR

Items:
- MTR Gulab Jamun (Qty: 30 pcs, Unit Price: Rs.120, Total: Rs.3600)
- Masala Dosa Mix (Qty: 40 pcs, Unit Price: Rs.95, Total: Rs.3800)
- Rava Idli Mix (Qty: 36 pcs, Unit Price: Rs.85, Total: Rs.3060)
- MTR Pickle 500g (Qty: 24 pcs, Unit Price: Rs.140, Total: Rs.3360)
- Badam Drink (Qty: 20 pcs, Unit Price: Rs.185, Total: Rs.3700)

Subtotal: Rs.17520
GST (12%): Rs.2102
Total: Rs.19622`
  },
  {
    name: 'RET-019_Wipro.txt',
    content: `INVOICE

Invoice Number: RET-019
Vendor: Wipro Consumer
Invoice Date: 15-04-2024
Due Date: 15-05-2024
Currency: INR

Items:
- Santoor Soap (Qty: 80 pcs, Unit Price: Rs.35, Total: Rs.2800)
- Santoor Handwash (Qty: 40 pcs, Unit Price: Rs.75, Total: Rs.3000)
- Wipro Safewash (Qty: 30 pcs, Unit Price: Rs.125, Total: Rs.3750)
- Garnier Men (Qty: 24 pcs, Unit Price: Rs.95, Total: Rs.2280)

Subtotal: Rs.11830
GST (18%): Rs.2129
Total: Rs.13959`
  },
  {
    name: 'RET-020_Emami.txt',
    content: `INVOICE

Invoice Number: RET-020
Vendor: Emami Limited
Invoice Date: 20-04-2024
Due Date: 20-05-2024
Currency: INR

Items:
- Navratna Oil (Qty: 48 pcs, Unit Price: Rs.85, Total: Rs.4080)
- BoroPlus Cream (Qty: 36 pcs, Unit Price: Rs.65, Total: Rs.2340)
- Zandu Balm (Qty: 60 pcs, Unit Price: Rs.35, Total: Rs.2100)
- Fair & Handsome (Qty: 24 pcs, Unit Price: Rs.95, Total: Rs.2280)
- Kesh King Oil (Qty: 20 pcs, Unit Price: Rs.145, Total: Rs.2900)

Subtotal: Rs.13700
GST (18%): Rs.2466
Total: Rs.16166`
  },
  {
    name: 'RET-021_Colgate.txt',
    content: `INVOICE

Invoice Number: RET-021
Vendor: Colgate Palmolive
Invoice Date: 25-04-2024
Due Date: 25-05-2024
Currency: INR

Items:
- Colgate Strong Teeth (Qty: 72 pcs, Unit Price: Rs.85, Total: Rs.6120)
- Colgate MaxFresh (Qty: 60 pcs, Unit Price: Rs.95, Total: Rs.5700)
- Palmolive Shower Gel (Qty: 30 pcs, Unit Price: Rs.140, Total: Rs.4200)
- Colgate Slimsoft (Qty: 48 pcs, Unit Price: Rs.45, Total: Rs.2160)

Subtotal: Rs.18180
GST (18%): Rs.3272
Total: Rs.21452`
  },
  {
    name: 'RET-022_HUL.txt',
    content: `INVOICE

Invoice Number: RET-022
Vendor: HUL Personal Care
Invoice Date: 30-04-2024
Due Date: 30-05-2024
Currency: INR

Items:
- Dove Shampoo (Qty: 36 pcs, Unit Price: Rs.185, Total: Rs.6660)
- Dove Soap (Qty: 48 pcs, Unit Price: Rs.65, Total: Rs.3120)
- Rexona Deo (Qty: 30 pcs, Unit Price: Rs.165, Total: Rs.4950)
- Lux Soap (Qty: 60 pcs, Unit Price: Rs.45, Total: Rs.2700)
- Ponds Cream (Qty: 24 pcs, Unit Price: Rs.125, Total: Rs.3000)

Subtotal: Rs.20430
GST (18%): Rs.3677
Total: Rs.24107`
  },
  {
    name: 'RET-023_Nivea.txt',
    content: `INVOICE

Invoice Number: RET-023
Vendor: Nivea India
Invoice Date: 05-05-2024
Due Date: 05-06-2024
Currency: INR

Items:
- Nivea Body Lotion (Qty: 30 pcs, Unit Price: Rs.245, Total: Rs.7350)
- Nivea Lip Balm (Qty: 48 pcs, Unit Price: Rs.55, Total: Rs.2640)
- Nivea Men Cream (Qty: 24 pcs, Unit Price: Rs.185, Total: Rs.4440)
- Nivea Deodorant (Qty: 30 pcs, Unit Price: Rs.175, Total: Rs.5250)

Subtotal: Rs.19680
GST (18%): Rs.3542
Total: Rs.23222`
  },
  {
    name: 'RET-024_Reckitt.txt',
    content: `INVOICE

Invoice Number: RET-024
Vendor: Reckitt Benckiser
Invoice Date: 10-05-2024
Due Date: 10-06-2024
Currency: INR

Items:
- Dettol Liquid (Qty: 30 pcs, Unit Price: Rs.165, Total: Rs.4950)
- Dettol Soap (Qty: 60 pcs, Unit Price: Rs.45, Total: Rs.2700)
- Harpic (Qty: 30 pcs, Unit Price: Rs.95, Total: Rs.2850)
- Lizol Floor Cleaner (Qty: 30 pcs, Unit Price: Rs.125, Total: Rs.3750)
- Durex Condoms (Qty: 20 pcs, Unit Price: Rs.195, Total: Rs.3900)

Subtotal: Rs.18150
GST (18%): Rs.3267
Total: Rs.21417`
  },
  {
    name: 'RET-025_Johnson.txt',
    content: `INVOICE

Invoice Number: RET-025
Vendor: Johnson & Johnson
Invoice Date: 15-05-2024
Due Date: 15-06-2024
Currency: INR

Items:
- J&J Baby Powder (Qty: 36 pcs, Unit Price: Rs.145, Total: Rs.5220)
- J&J Baby Soap (Qty: 48 pcs, Unit Price: Rs.55, Total: Rs.2640)
- J&J Shampoo (Qty: 30 pcs, Unit Price: Rs.125, Total: Rs.3750)
- Band Aid Box (Qty: 20 pcs, Unit Price: Rs.95, Total: Rs.1900)

Subtotal: Rs.13510
GST (18%): Rs.2432
Total: Rs.15942`
  },
  {
    name: 'RET-026_Bikanervala.txt',
    content: `INVOICE

Invoice Number: RET-026
Vendor: Bikanervala
Invoice Date: 20-05-2024
Due Date: 20-06-2024
Currency: INR

Items:
- Bikaneri Bhujia (Qty: 40 pcs, Unit Price: Rs.110, Total: Rs.4400)
- Rasgulla Tin (Qty: 24 pcs, Unit Price: Rs.195, Total: Rs.4680)
- Soan Papdi Premium (Qty: 30 pcs, Unit Price: Rs.175, Total: Rs.5250)
- Kaju Katli (Qty: 20 pcs, Unit Price: Rs.485, Total: Rs.9700)

Subtotal: Rs.24030
GST (12%): Rs.2884
Total: Rs.26914`
  },
  {
    name: 'RET-027_Mother.txt',
    content: `INVOICE

Invoice Number: RET-027
Vendor: Mother Dairy
Invoice Date: 25-05-2024
Due Date: 25-06-2024
Currency: INR

Items:
- Mother Dairy Milk (Qty: 100 pcs, Unit Price: Rs.68, Total: Rs.6800)
- Mother Dairy Paneer (Qty: 30 pcs, Unit Price: Rs.285, Total: Rs.8550)
- Mother Dairy Dahi (Qty: 40 pcs, Unit Price: Rs.45, Total: Rs.1800)
- Mother Dairy Ice Cream (Qty: 30 pcs, Unit Price: Rs.195, Total: Rs.5850)
- Mother Dairy Ghee (Qty: 20 pcs, Unit Price: Rs.485, Total: Rs.9700)

Subtotal: Rs.32700
GST (12%): Rs.3924
Total: Rs.36624`
  },
  {
    name: 'RET-028_Parag.txt',
    content: `INVOICE

Invoice Number: RET-028
Vendor: Parag Milk Foods
Invoice Date: 30-05-2024
Due Date: 30-06-2024
Currency: INR

Items:
- Gowardhan Ghee (Qty: 24 pcs, Unit Price: Rs.595, Total: Rs.14280)
- Gowardhan Paneer (Qty: 30 pcs, Unit Price: Rs.295, Total: Rs.8850)
- Go Cheese (Qty: 24 pcs, Unit Price: Rs.185, Total: Rs.4440)
- Go Butter (Qty: 30 pcs, Unit Price: Rs.245, Total: Rs.7350)

Subtotal: Rs.34920
GST (12%): Rs.4190
Total: Rs.39110`
  },
  {
    name: 'RET-029_Kwality.txt',
    content: `INVOICE

Invoice Number: RET-029
Vendor: Kwality Walls
Invoice Date: 05-06-2024
Due Date: 05-07-2024
Currency: INR

Items:
- Kwality Walls Cornetto (Qty: 60 pcs, Unit Price: Rs.45, Total: Rs.2700)
- Magnum Ice Cream (Qty: 36 pcs, Unit Price: Rs.125, Total: Rs.4500)
- Feast Ice Cream (Qty: 48 pcs, Unit Price: Rs.65, Total: Rs.3120)
- Kulfi (Qty: 40 pcs, Unit Price: Rs.35, Total: Rs.1400)
- Softy Mix (Qty: 24 pcs, Unit Price: Rs.185, Total: Rs.4440)

Subtotal: Rs.16160
GST (18%): Rs.2909
Total: Rs.19069`
  },
  {
    name: 'RET-030_Vadilal.txt',
    content: `INVOICE

Invoice Number: RET-030
Vendor: Vadilal Enterprises
Invoice Date: 10-06-2024
Due Date: 10-07-2024
Currency: INR

Items:
- Vadilal Ice Cream 1L (Qty: 36 pcs, Unit Price: Rs.195, Total: Rs.7020)
- Vadilal Kulfi (Qty: 48 pcs, Unit Price: Rs.55, Total: Rs.2640)
- Rajbhog Ice Cream (Qty: 30 pcs, Unit Price: Rs.125, Total: Rs.3750)
- Vadilal Faluda (Qty: 24 pcs, Unit Price: Rs.145, Total: Rs.3480)

Subtotal: Rs.16890
GST (18%): Rs.3040
Total: Rs.19930`
  },
];

// Dev bypass token - used when Auth0 is not configured
const DEV_TOKEN = "dev-bypass-token";

export function InvoicesPage() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loadingDemo, setLoadingDemo] = useState(false);

  const getToken = async (): Promise<string> => {
    if (isAuthenticated) {
      return await getAccessTokenSilently();
    }
    return DEV_TOKEN;
  };

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    accept: '.pdf,.csv,.png,.jpg,.jpeg',
    multiple: true,
    onFilesAdded: async (newFiles) => {
      for (const fileItem of newFiles) {
        const file = fileItem.file instanceof File ? fileItem.file : null;
        if (!file) continue;

        const uploadFile: UploadFile = {
          ...fileItem,
          progress: 0,
          status: 'uploading',
        };
        setUploadFiles((prev) => [...prev, uploadFile]);

        try {
          const token = await getToken();
          await api.uploadInvoice(file, token);
          setUploadFiles((prev) =>
            prev.map((f) => f.id === fileItem.id ? { ...f, progress: 100, status: 'completed' } : f)
          );
          await fetchInvoices();
        } catch {
          setUploadFiles((prev) =>
            prev.map((f) => f.id === fileItem.id ? { ...f, progress: 0, status: 'error', error: 'Upload failed' } : f)
          );
        }
      }
    },
  });

  const fetchInvoices = async () => {
    try {
      const token = await getToken();
      const data = await api.listInvoices(token);
      setInvoices(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [isAuthenticated, getAccessTokenSilently]);

  const removeUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    removeFile(fileId);
  };

  const retryUpload = async (fileId: string) => {
    const fileItem = uploadFiles.find((f) => f.id === fileId);
    if (!fileItem || !(fileItem.file instanceof File)) return;

    setUploadFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, progress: 0, status: 'uploading', error: undefined } : f))
    );

    try {
      const token = await getToken();
      await api.uploadInvoice(fileItem.file, token);
      setUploadFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f)));
      await fetchInvoices();
    } catch {
      setUploadFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'error', error: 'Upload failed' } : f)));
    }
  };

  const getFileIcon = (file: File | { type: string }) => {
    const type = file instanceof File ? file.type : file.type;
    if (type?.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (type?.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type?.includes('csv') || type?.includes('sheet')) return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Paid: 'bg-emerald-100 text-emerald-700',
      Pending: 'bg-amber-100 text-amber-700',
      Overdue: 'bg-rose-100 text-rose-700',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesSearch = inv.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n) : "—";

  const loadDemoInvoices = async () => {
    setLoadingDemo(true);
    setError(null);
    try {
      const token = await getToken();
      for (const demo of DEMO_INVOICES) {
        const file = new File([demo.content], demo.name, { type: 'text/plain' });
        await api.uploadInvoice(file, token);
      }
      await fetchInvoices();
    } catch (e: any) {
      console.error('Demo load error:', e);
      const msg = e?.message || 'Failed to load demo invoices';
      setError(msg.includes('GEMINI_API_KEY') ? 'Error: Gemini API key not configured in backend .env file' : msg);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="p-3 space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Invoices</h1>
          <p className="text-[10px] text-muted-foreground">Manage your invoices</p>
        </div>
        <div className="flex items-center gap-2">
          {invoices.length === 0 && (
            <Button
              onClick={loadDemoInvoices}
              disabled={loadingDemo}
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 rounded-none border-emerald-200 hover:bg-emerald-50"
            >
              <Database className="w-3 h-3 mr-1" />
              {loadingDemo ? 'Loading...' : 'Load Demo'}
            </Button>
          )}
          <span className="text-[10px] text-muted-foreground">{invoices.length}</span>
        </div>
      </div>

      {/* Upload Area - Compact */}
      <div className="border rounded-none">
        <div className="p-2 border-b">
          <p className="text-[11px] font-medium">Upload</p>
        </div>
        <div className="p-2">
          <div
            className={cn(
              'relative border border-dashed p-3 text-center transition-colors cursor-pointer',
              isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-border hover:border-muted-foreground/50'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input {...getInputProps()} className="sr-only" />
            <div className="flex items-center justify-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-[11px] font-medium">Drop or click to upload</p>
                <p className="text-[9px] text-muted-foreground">PDF, CSV, PNG, JPG</p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-medium">Uploading {uploadFiles.length}</p>
                <Button onClick={clearFiles} variant="ghost" size="sm" className="h-5 text-[9px] px-1">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5">Name</TableHead>
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5">Size</TableHead>
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5">Status</TableHead>
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 w-[40px] text-right">Act</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadFiles.map((fileItem) => (
                      <TableRow key={fileItem.id}>
                        <TableCell className="py-1 px-1.5">
                          <div className="flex items-center gap-1.5">
                            {fileItem.status === 'uploading' ? (
                              <div className="relative">
                                <svg className="size-3.5 -rotate-90" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/20" />
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeDasharray={`${2 * Math.PI * 10}`}
                                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - fileItem.progress / 100)}`}
                                    className="text-emerald-600 transition-all duration-300"
                                    strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {getFileIcon(fileItem.file)}
                                </div>
                              </div>
                            ) : (
                              getFileIcon(fileItem.file)
                            )}
                            <span className="text-[9px] font-medium truncate max-w-[100px]">{fileItem.file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1.5 text-[9px] text-muted-foreground">{formatBytes(fileItem.file.size)}</TableCell>
                        <TableCell className="py-1 px-1.5">
                          {fileItem.status === 'uploading' && <span className="text-[9px] text-muted-foreground">{Math.round(fileItem.progress)}%</span>}
                          {fileItem.status === 'completed' && <span className="text-[9px] text-emerald-600">Done</span>}
                          {fileItem.status === 'error' && <span className="text-[9px] text-rose-600">Err</span>}
                        </TableCell>
                        <TableCell className="py-1 px-1.5 text-right">
                          {fileItem.status === 'error' ? (
                            <Button onClick={() => retryUpload(fileItem.id)} variant="ghost" size="sm" className="h-4 text-[9px] px-0.5 text-rose-600">
                              Retry
                            </Button>
                          ) : (
                            <Button onClick={() => removeUploadFile(fileItem.id)} variant="ghost" size="sm" className="h-4 w-4 p-0">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Errors */}
          {(error || errors.length > 0) && (
            <div className="mt-2 border border-rose-200 bg-rose-50 p-1.5">
              <div className="flex items-center gap-1.5 text-rose-700 text-[9px]">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Error</span>
              </div>
              <div className="mt-0.5 text-[9px] text-rose-600">
                {error && <p>{error}</p>}
                {errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice List */}
      <div className="border rounded-none">
        <div className="p-2 border-b flex items-center justify-between">
          <p className="text-[11px] font-medium">Invoices</p>
          <span className="text-[9px] text-muted-foreground">{filteredInvoices.length}</span>
        </div>
        <div className="p-2">
          {/* Filters */}
          <div className="flex gap-1.5 mb-2">
            <div className="relative flex-1 max-w-[160px]">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-0.5 text-[10px] border rounded-none bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-1.5 py-0.5 text-[10px] border rounded-none bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-muted-foreground text-[10px] py-3">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-[10px] py-3">No invoices yet. Upload one above.</p>
          ) : (
            <div className="border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground">Invoice</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground">Vendor</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground text-right">Total</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground text-center">Sts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv, index) => (
                    <TableRow key={inv.id} className={index % 2 === 0 ? "bg-white hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"}>
                      <TableCell className="text-[9px] py-1 px-1.5 font-medium">{inv.invoice_number || "—"}</TableCell>
                      <TableCell className="text-[9px] py-1 px-1.5 text-muted-foreground">{inv.vendor || "—"}</TableCell>
                      <TableCell className="text-[9px] py-1 px-1.5">{inv.invoice_date || "—"}</TableCell>
                      <TableCell className="text-[9px] py-1 px-1.5 text-right font-medium">{fmt(inv.total)}</TableCell>
                      <TableCell className="py-1 px-1.5 text-center">{getStatusBadge(inv.status || 'Pending')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-2 text-[9px] text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
