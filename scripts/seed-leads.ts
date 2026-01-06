
import { supabaseAdmin } from "../src/lib/supabase-admin";

const mockLeads = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '+91 9876543210', status: 'new', source: 'Website', interest: 'Premium Package', notes: 'Interested in enterprise plan' },
  { name: 'Priya Patel', email: 'priya.patel@yahoo.com', phone: '+91 8765432109', status: 'new', source: 'Facebook', interest: 'Digital Marketing Services', notes: 'Wants pricing details' },
  { name: 'Amit Kumar', email: 'amit.kumar@outlook.com', phone: '+91 7654321098', status: 'new', source: 'Referral', interest: 'Web Development', notes: 'Looking for custom website' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', phone: '+91 9988776655', status: 'new', source: 'LinkedIn', interest: 'SEO Services', notes: 'Needs immediate quote' },
  { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '+91 8877665544', status: 'new', source: 'Google Ads', interest: 'Mobile App Development', notes: 'Budget: 5-10 lakhs' },
  { name: 'Anjali Mehta', email: 'anjali.mehta@hotmail.com', phone: '+91 7766554433', status: 'new', source: 'Instagram', interest: 'Social Media Marketing', notes: 'Startup company' },
  { name: 'Rajesh Gupta', email: 'rajesh.gupta@gmail.com', phone: '+91 9955443322', status: 'new', source: 'WhatsApp', interest: 'E-commerce Website', notes: 'Shopify integration needed' },
  { name: 'Kavita Joshi', email: 'kavita.joshi@gmail.com', phone: '+91 8844332211', status: 'new', source: 'Website', interest: 'Branding Services', notes: 'New business launch' },
  { name: 'Arjun Verma', email: 'arjun.verma@yahoo.com', phone: '+91 7733221100', status: 'new', source: 'Facebook', interest: 'Content Writing', notes: 'Monthly retainer interest' },
  { name: 'Pooja Nair', email: 'pooja.nair@gmail.com', phone: '+91 9922118877', status: 'new', source: 'Referral', interest: 'Graphic Design', notes: 'Logo design needed urgently' },
  { name: 'Suresh Iyer', email: 'suresh.iyer@outlook.com', phone: '+91 8811776655', status: 'new', source: 'LinkedIn', interest: 'Video Production', notes: 'Corporate video project' },
  { name: 'Deepa Krishnan', email: 'deepa.krishnan@gmail.com', phone: '+91 7700665544', status: 'new', source: 'Google Ads', interest: 'Email Marketing', notes: 'Newsletter campaign setup' },
  { name: 'Manish Agarwal', email: 'manish.agarwal@gmail.com', phone: '+91 9988554433', status: 'new', source: 'Website', interest: 'Consulting Services', notes: 'Business growth strategy' },
  { name: 'Neha Kapoor', email: 'neha.kapoor@hotmail.com', phone: '+91 8877443322', status: 'new', source: 'Instagram', interest: 'Photography Services', notes: 'Wedding photography' },
  { name: 'Sanjay Pillai', email: 'sanjay.pillai@gmail.com', phone: '+91 7766332211', status: 'new', source: 'WhatsApp', interest: 'UI/UX Design', notes: 'Mobile app redesign' },
  { name: 'Ritika Bansal', email: 'ritika.bansal@yahoo.com', phone: '+91 9955221100', status: 'new', source: 'Facebook', interest: 'Cloud Services', notes: 'AWS migration project' },
  { name: 'Karan Malhotra', email: 'karan.malhotra@gmail.com', phone: '+91 8844119988', status: 'new', source: 'Referral', interest: 'Cybersecurity', notes: 'Security audit needed' },
  { name: 'Tanya Saxena', email: 'tanya.saxena@outlook.com', phone: '+91 7733008877', status: 'new', source: 'LinkedIn', interest: 'AI/ML Solutions', notes: 'Chatbot development' },
  { name: 'Varun Chopra', email: 'varun.chopra@gmail.com', phone: '+91 9922997766', status: 'new', source: 'Website', interest: 'Blockchain Development', notes: 'NFT marketplace' },
  { name: 'Simran Kaur', email: 'simran.kaur@gmail.com', phone: '+91 8811886655', status: 'new', source: 'Google Ads', interest: 'DevOps Services', notes: 'CI/CD pipeline setup' },
  { name: 'Rohit Bhatia', email: 'rohit.batia@hotmail.com', phone: '+91 7700775544', status: 'new', source: 'Instagram', interest: 'Data Analytics', notes: 'Dashboard creation' },
  { name: 'Meera Desai', email: 'meera.desai@gmail.com', phone: '+91 9988663322', status: 'new', source: 'WhatsApp', interest: 'CRM Development', notes: 'Custom CRM solution' },
  { name: 'Nikhil Rao', email: 'nikhil.rao@yahoo.com', phone: '+91 8877552211', status: 'new', source: 'Facebook', interest: 'Payment Gateway', notes: 'Integration services' },
  { name: 'Shreya Mishra', 'email': 'shreya.mishra@gmail.com', phone: '+91 7766441100', status: 'new', source: 'Referral', interest: 'Chatbot Development', notes: 'WhatsApp bot needed' },
  { name: 'Aditya Pandey', email: 'aditya.pandey@outlook.com', phone: '+91 9955330099', status: 'new', source: 'LinkedIn', interest: 'API Development', notes: 'REST API services' }
];

async function seed() {
  console.log('Starting seed...');
  
  // 1. Check if leads already exist
  const { count } = await supabaseAdmin.from('leads').select('*', { count: 'exact', head: true });
  
  if (count && count > 0) {
    console.log(`Database already has ${count} leads. Skipping seed.`);
    return;
  }

  // 2. Insert mock leads
  const { error } = await supabaseAdmin.from('leads').insert(mockLeads);
  
  if (error) {
    console.error('Error seeding leads:', error);
  } else {
    console.log('Successfully seeded 25 mock leads!');
  }
}

seed();
