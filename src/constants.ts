
import { Category, MenuItem, ModifierGroup } from './types';

export const CURRENCY = '£';
export const DELIVERY_CHARGE = 2.00;

// 7, esplanade building, Friars Rd, Barry CF62 5TJ
export const SHOP_LOCATION = {
  lat: 51.391629,
  lng: -3.273656,
  address: "7, Esplanade Building, Friars Rd, Barry CF62 5TJ"
};

export const MAX_DELIVERY_MILES = 8;

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.CHIPS]: 'yellow',
  [Category.FISH]: 'blue',
  [Category.PIES]: 'fuchsia',
  [Category.SAUSAGES]: 'rose',
  [Category.CHICKEN]: 'grey',
  [Category.BITES]: 'indigo',
  [Category.KEBABS]: 'slateSoft',
  [Category.BURGERS]: 'slateSoft',
  [Category.WRAPS]: 'slateSoft',
  [Category.SIDES]: 'grey',
  [Category.POTS]: 'orange',
  [Category.KIDS_MEALS]: 'pink',
  [Category.DRINKS]: 'cyan',
};

export const getCategoryColor = (category: Category): string => {
  return CATEGORY_COLORS[category] || 'slate';
};

export const getCategoryEmoji = (category: Category): string => {
  switch (category) {
    case Category.CHIPS: return '🍟';
    case Category.FISH: return '🐟';
    case Category.PIES: return '🥧';
    case Category.SAUSAGES: return '🌭';
    case Category.CHICKEN: return '🍗';
    case Category.BITES: return '🍿';
    case Category.KEBABS: return '🥙';
    case Category.BURGERS: return '🍔';
    case Category.WRAPS: return '🌯';
    case Category.SIDES: return '🧅';
    case Category.POTS: return '🥣';
    case Category.KIDS_MEALS: return '🧸';
    case Category.DRINKS: return '🥤';
    default: return '🍽️';
  }
};

export const getItemEmoji = (item: MenuItem): string => {
  const name = item.name.toLowerCase();
  if (name === 'chips') return '🍟';
  if (name === 'cheese & chips') return '🧀';
  if (name === 'cheese, chips & beans') return '🫘';
  if (name === 'chip butty') return '🍞';
  if (name === 'chips & gravy' || name === 'cheese, chips & gravy') return '🟤';
  if (name === 'chips & curry' || name === 'cheese, chips & curry') return '🟡';
  return getCategoryEmoji(item.category);
};

export const getModifierGroupIdsForItem = (item: MenuItem): string[] => {
  return item.modifierGroupIds || [];
};

// Initial Data for dynamic state
export const DEFAULT_MODIFIER_GROUPS: ModifierGroup[] = [
  // --- SIZES ---
  {
    id: 'size_fish',
    name: "Fish Size",
    allowMultiple: false,
    options: [
      { name: "M", price: 0 },
      { name: "L", price: 1.50 },
      { name: "Medium & Chips Box", price: 3.00, triggersGroupIds: ['chips_sauce', 'condiments'] }, // 8 + 3 = 11
      { name: "Large & Chips Box", price: 5.00, triggersGroupIds: ['chips_sauce', 'condiments'] }   // 8 + 5 = 13
    ]
  },
  {
    id: 'cod_bites_size',
    name: "How Many?",
    allowMultiple: false,
    options: [
      { name: "1 Pc", price: 0 },
      { name: "4 Pcs", price: 5.10 }, // 1.90 + 5.10 = 7.00
      { name: "4 Pcs & Chips Box", price: 8.10, triggersGroupIds: ['chips_sauce', 'condiments'] } // 1.90 + 8.10 = 10.00
    ]
  },
  {
    id: 'size_chips',
    name: "Portion Size",
    allowMultiple: false,
    options: [
      { name: "S", price: 0, triggersGroupId: 'chips_sauce' },
      { name: "M", price: 0.80, triggersGroupId: 'chips_sauce' },
      { name: "L", price: 1.50, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'size_burger',
    name: "Burger Size",
    allowMultiple: false,
    options: [
      { name: "1/4 lb", price: 0 },
      { name: "1/2 lb", price: 1.50 }
    ]
  },
  {
    id: 'size_side',
    name: "Pot Size",
    allowMultiple: false,
    options: [
      { name: "S", price: 0 },
      { name: "L", price: 1.00 }
    ]
  },
  // -- SAUSAGE SIZES --
  {
    id: 'size_sausage_plain',
    name: "Sausage Size",
    allowMultiple: false,
    options: [
      { name: "S", price: 0, triggersGroupId: 'opt_chips_sausage_small' }, // Base 1.50
      { name: "L", price: 0.70, triggersGroupId: 'opt_chips_sausage_large' } // Base 1.50 + 0.70 = 2.20
    ]
  },
  {
    id: 'size_sausage_battered',
    name: "Sausage Size",
    allowMultiple: false,
    options: [
      { name: "S", price: 0, triggersGroupId: 'opt_chips_battered_small' }, // Base 1.70
      { name: "L", price: 0.80, triggersGroupId: 'opt_chips_battered_large' } // Base 1.70 + 0.80 = 2.50
    ]
  },

  // --- OPTIONS ---
  {
    id: 'fish_chip_opt_med',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.00, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'fish_chip_opt_lrg',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.50, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'chips_cod_bites',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.00, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'chips_fish_cake',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.20, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'pie_chips_opt',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "Pie Only", price: 0 },
      { name: "With Chips", price: 3.00, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  // -- SAUSAGE CHIP OPTIONS (Calculated to match totals) --
  {
    id: 'opt_chips_sausage_small',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.40, triggersGroupId: 'chips_sauce' } // 1.50 + 3.40 = 4.90
    ]
  },
  {
    id: 'opt_chips_sausage_large',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.40, triggersGroupId: 'chips_sauce' } // 2.20 + 3.40 = 5.60
    ]
  },
  {
    id: 'opt_chips_battered_small',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.30, triggersGroupId: 'chips_sauce' } // 1.70 + 3.30 = 5.00
    ]
  },
  {
    id: 'opt_chips_battered_large',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "And Chips", price: 3.40, triggersGroupId: 'chips_sauce' } // 2.50 + 3.40 = 5.90
    ]
  },

  {
    id: 'salad',
    name: "Salad",
    allowMultiple: true,
    options: [
      { name: "All Salad", price: 0 },
      { name: "Lettuce", price: 0 },
      { name: "Onion", price: 0 },
      { name: "Tomato", price: 0 },
      { name: "Cucumber", price: 0 },
      { name: "Jalapeno", price: 0 },
      { name: "Slice Cheese", price: 0 },
      { name: "Mozz Cheese", price: 1.50 },
      { name: "fried onions", price: 0 },
      { name: "Salad Separate", price: 0 }, 
    ]
  },
  {
    id: 'sauce',
    name: "Sauce",
    allowMultiple: true,
    options: [
      { name: "Chilli Sauce", price: 0 },
      { name: "Garlic Mayo", price: 0 },
      { name: "Mayo", price: 0 },
      { name: "Ketchup", price: 0 },
      { name: "Mint Sauce", price: 0 },
      { name: "BBQ Sauce", price: 0 },
      { name: "Burger Sauce", price: 0 },
      { name: "Relish", price: 0 },
      { name: "No Sauce", price: 0 },
      { name: "Sauce Separate", price: 0.50 }
    ]
  },
  {
    id: 'condiments',
    name: "Condiments",
    allowMultiple: true,
    options: [
      { name: "Salt & Vinegar", price: 0 },
      { name: "Salt", price: 0 },
      { name: "Vinegar", price: 0 },
      { name: "Extra", price: 0 },
      { name: "less", price: 0 }
    ]
  },
  {
    id: 'meal_upgrade',
    name: "Make it a Meal?",
    allowMultiple: false,
    options: [
      { name: "Burger Only", price: 0 },
      { name: "Meal", price: 3.00, triggersGroupIds: ['condiments', 'meal_drinks', 'chips_sauce'] }
    ]
  },
  {
    id: 'wrap_meal_upgrade',
    name: "Make it a Meal?",
    allowMultiple: false,
    options: [
      { name: "Wrap Only", price: 0 },
      { name: "Meal", price: 3.50, triggersGroupIds: ['condiments', 'meal_drinks', 'chips_sauce'] }
    ]
  },
  {
    id: 'meal_drinks',
    name: "Meal Drink Selection",
    allowMultiple: false,
    options: [
      { name: "Coke", price: 0 },
      { name: "Zero Coke", price: 0 },
      { name: "Cherry", price: 0 },
      { name: "Pepsi Max", price: 0 },
      { name: "Dr Pepper", price: 0 },
      { name: "7up", price: 0 },
      { name: "Fanta Lemon", price: 0 },
      { name: "Apple Tango", price: 0 },
      { name: "Orange Tango", price: 0 },
      { name: "Mango", price: 0 },
      { name: "Rio", price: 0 },
      { name: "Water", price: 0 },
      { name: "Ribena", price: 0 },
      { name: "Fruit Shoot Blackcurrant", price: 0 },
      { name: "Fruit Shoot Orange", price: 0 }
    ]
  },
  {
    id: 'chips_sauce',
    name: "Sauce & Toppings",
    allowMultiple: true,
    options: [
      { name: "Mild Curry", price: 1.40 },
      { name: "Irish Curry", price: 1.40 },
      { name: "Fruit Curry", price: 1.40 },
      { name: "Gravy", price: 1.40 },
      { name: "Mushy Peas", price: 2.20 },
      { name: "Beans", price: 2.20 },
      { name: "Cheese", price: 1.50 }
    ]
  },
  {
    id: 'chips_addons',
    name: "Add Extras",
    allowMultiple: true,
    options: [
      { name: "Sausage (S)", price: 1.50 },
      { name: "Sausage (L)", price: 2.20 },
      { name: "Battered Sausage (S)", price: 1.70 },
      { name: "Battered Sausage (L)", price: 2.50 },
      { name: "Fish Cake", price: 2.00 }
    ]
  },
  {
    id: 'kebab_burger_meat',
    name: "Meat Choice",
    allowMultiple: false,
    options: [
      { name: "Doner Meat", price: 0 },
      { name: "Chicken Meat", price: 0 },
      { name: "Mix Meat", price: 0 }
    ]
  },
  
  // --- NEW SIDES MODIFIERS ---
  {
    id: 'sauce_pot_type',
    name: "Select Side",
    allowMultiple: false,
    options: [
      { name: "Mild Curry", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Irish Curry", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Fruit Curry", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Gravy", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Mushy Peas", price: 2.20 }, // Fixed Large
      { name: "Beans", price: 2.20 }, // Fixed Large
      { name: "Cheese", price: 2.20 } // Fixed Large
    ]
  },
  {
    id: 'sauce_pot_size_upgrade',
    name: "Pot Size",
    allowMultiple: false,
    options: [
      { name: "(S) pot", price: 0 },
      { name: "(L) pot", price: 0.80 } // 1.40 + 0.80 = 2.20
    ]
  },
  {
    id: 'side_add_chips',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "(S) Chips", price: 2.70, triggersGroupIds: ['chips_sauce', 'condiments'] },
      { name: "(M) Chips", price: 3.50, triggersGroupIds: ['chips_sauce', 'condiments'] },
      { name: "(L) Chips", price: 4.20, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  {
    id: 'chicken_breast_chips',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chips", price: 0 },
      { name: "With Chips", price: 2.90, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  {
    id: 'chicken_curry_style',
    name: "Serve With",
    allowMultiple: false,
    options: [
      { name: "Rice", price: 0 },
      { name: "Chips", price: 0, triggersGroupId: 'condiments' },
      { name: "Chips & Rice", price: 2.00, triggersGroupId: 'condiments' }
    ]
  },
  // --- KIDS MEAL MODIFIERS ---
  {
    id: 'kids_drink_select',
    name: "Select Drink",
    allowMultiple: false,
    options: [
      { name: "Coke", price: 0 },
      { name: "Zero Coke", price: 0 },
      { name: "Fanta", price: 0 },
      { name: "7up", price: 0 },
      { name: "Dr Pepper", price: 0 },
      { name: "Fruit Shoot Orange", price: 0 },
      { name: "Fruit Shoot Blackcurrant", price: 0 },
      { name: "Water", price: 0 }
    ]
  },
  {
    id: 'kids_sausage_type',
    name: "Sausage Type",
    allowMultiple: false,
    options: [
      { name: "Plain", price: 0 },
      { name: "Battered", price: 0 }
    ]
  },
  {
    id: 'kids_sauce_choice',
    name: "Select Sauce",
    allowMultiple: false,
    options: [
      { name: "Mild Curry", price: 0 },
      { name: "Irish Curry", price: 0 },
      { name: "Fruit Curry", price: 0 },
      { name: "Gravy", price: 0 },
      { name: "Beans", price: 0 },
      { name: "Mushy Peas", price: 0 }
    ]
  },
  
  // --- DRINK OPTIONS ---
  {
    id: 'all_drinks_opt',
    name: "Select Drink",
    allowMultiple: false,
    options: [
      { name: "Coke", price: 1.50 },
      { name: "Zero Coke", price: 1.50 },
      { name: "Cherry", price: 1.50 },
      { name: "Pepsi Max", price: 1.50 },
      { name: "Dr Pepper", price: 1.50 },
      { name: "7up", price: 1.50 },
      { name: "Fanta Lemon", price: 1.50 },
      { name: "Apple Tango", price: 1.50 },
      { name: "Orange Tango", price: 1.50 },
      { name: "Mango", price: 1.50 },
      { name: "Rio", price: 1.50 },
      { name: "Water", price: 1.50 },
      { name: "Ribena", price: 1.50 },
      { name: "Fruit Shoot Blackcurrant", price: 1.00 },
      { name: "Fruit Shoot Orange", price: 1.00 }
    ]
  },
  // --- DIP OPTIONS (For new Dips item) ---
  {
    id: 'dip_flavours',
    name: "Select Dip",
    allowMultiple: false,
    options: [
      { name: "Chilli Sauce", price: 0 },
      { name: "Garlic Mayo", price: 0 },
      { name: "Mayo", price: 0 },
      { name: "Ketchup", price: 0 },
      { name: "BBQ Sauce", price: 0 },
      { name: "Burger Sauce", price: 0 },
      { name: "Relish", price: 0 },
      { name: "Mint Sauce", price: 0 },
      { name: "Tartar Sauce", price: 0 }
    ]
  },
  // --- NEW CONSOLIDATED MODIFIER GROUPS ---
  {
    id: 'sausage_type',
    name: 'Sausage Type',
    allowMultiple: false,
    options: [
      { name: 'Plain', price: 0 },
      { name: 'Battered', price: 0.20 }
    ]
  },
  {
    id: 'sausage_size',
    name: 'Sausage Size',
    allowMultiple: false,
    options: [
      { name: 'S', price: 0 },
      { name: 'L', price: 0.70 }
    ]
  },
  {
    id: 'pie_flavor',
    name: 'Pie Flavor',
    allowMultiple: false,
    options: [
      { name: 'Steak & Kidney Pie', price: 0 },
      { name: 'Chicken & Mushroom Pie', price: 0 },
      { name: 'Minced Beef & Onion Pie', price: 0 }
    ]
  },
  {
    id: 'add_chips_standard',
    name: 'Add Chips?',
    allowMultiple: false,
    options: [
      { name: 'No Chips', price: 0 },
      { name: '(S) Chips', price: 3.00, triggersGroupId: 'chips_sauce' },
      { name: '(M) Chips', price: 3.80, triggersGroupId: 'chips_sauce' },
      { name: '(L) Chips', price: 4.50, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'kebab_flavor',
    name: 'Kebab Flavor',
    allowMultiple: false,
    options: [
      { name: 'Doner Meat', price: 0 },
      { name: 'Chicken Kebab', price: 0 },
      { name: 'Mix Kebab', price: 0 }
    ]
  },
  {
    id: 'size_kebab',
    name: "Kebab Size",
    allowMultiple: false,
    options: [
      { name: "Medium", price: 0 },
      { name: "Large", price: 2.00 }
    ]
  },

  {
    id: 'kebab_base',
    name: "Served With",
    allowMultiple: true,
    maxSelection: 2,
    options: [
      { name: "Pitta Bread", price: 0 },
      { name: "On Chips", price: 0, triggersGroupIds: ['condiments', 'chips_sauce'] }, // Triggers multiple
      { name: "Extra Pitta", price: 1.20 },
      { name: "Rice", price: 1.50 }
    ]
  },
  {
    id: 'wrap_flavor',
    name: 'Wrap Flavor',
    allowMultiple: false,
    options: [
      { name: 'Chicken Strips', price: 0 },
      { name: 'Doner Meat', price: 0 },
      { name: 'Chicken Kebab', price: 0 },
      { name: 'Mix Kebab', price: 0 },
      { name: 'Veggie', price: 0 }
    ]
  },
  {
    id: 'burger_flavor',
    name: 'Burger Flavor',
    allowMultiple: false,
    options: [
      { name: 'Beef Burger', price: 0 },
      { name: 'Cheese Burger', price: 0 },
      { name: 'Chicken Burger', price: 0 },
      { name: 'Veggie Burger', price: 0 },
      { name: 'Kebab Burger', price: 0, triggersGroupId: 'kebab_burger_meat' }
    ]
  },
  {
    id: 'kids_meal_type',
    name: 'Kids Meal Type',
    allowMultiple: false,
    options: [
      { name: 'Fish Cake', price: 0 },
      { name: 'Cod Bites (2)', price: 0.50 },
      { name: 'Sausage', price: 0, triggersGroupId: 'kids_sausage_type' },
      { name: 'Chicken Nuggets (4)', price: 0 },
      { name: 'Chicken Strips (2)', price: 0.50 },
    ]
  }
];

export const MENU_ITEMS: MenuItem[] = [
  // CHIPS
  {
    id: '12',
    name: 'Chips',
    price: 2.70, // Base Price (Small)
    category: Category.CHIPS,
    modifierGroupIds: ['size_chips', 'chips_sauce', 'condiments', 'chips_addons']
  },
  {
    id: 'chip_butty',
    name: 'Chip Butty',
    price: 4.20,
    category: Category.CHIPS,
    modifierGroupIds: ['chips_sauce', 'condiments', 'chips_addons']
  },

  // FISH
  {
    id: 'cod_fillet',
    name: 'Cod',
    price: 8.00,
    category: Category.FISH,
    modifierGroupIds: ['size_fish', 'side_add_chips', 'condiments']
  },
  {
    id: 'cod_bites_main',
    name: 'Cod Bites',
    price: 1.90,
    category: Category.FISH,
    modifierGroupIds: ['cod_bites_size', 'side_add_chips', 'condiments']
  },
  {
    id: 'fish_cake',
    name: 'Fish Cake',
    price: 2.00,
    category: Category.FISH,
    modifierGroupIds: ['side_add_chips', 'condiments']
  },

  // PIES
  {
    id: 'pie',
    name: 'Pie',
    price: 4.00,
    category: Category.PIES,
    modifierGroupIds: ['pie_flavor', 'side_add_chips', 'condiments']
  },

  // SAUSAGES
  {
    id: 'sausage',
    name: 'Sausage',
    price: 1.50, // Small Base
    category: Category.SAUSAGES,
    modifierGroupIds: ['sausage_type', 'sausage_size', 'side_add_chips', 'condiments', 'chips_sauce']
  },
  
  // Kebabs
  {
    id: 'kebab_box',
    name: 'Kebab Box',
    price: 9.00,
    category: Category.KEBABS,
    modifierGroupIds: ['kebab_flavor', 'size_kebab', 'kebab_base', 'salad', 'sauce']
  },

  // Wraps
  {
    id: 'wrap',
    name: 'Wrap',
    price: 7.00,
    category: Category.WRAPS,
    modifierGroupIds: ['wrap_flavor', 'wrap_meal_upgrade', 'salad', 'sauce']
  },

  // Burgers
  {
    id: 'burger',
    name: 'Burger',
    price: 5.50,
    category: Category.BURGERS,
    modifierGroupIds: ['burger_flavor', 'size_burger', 'meal_upgrade', 'salad', 'sauce']
  },

  // KIDS MEALS
  {
    id: 'kids_meal',
    name: "Kids Meal",
    description: "Main, chips & drink 330ml",
    price: 5.50,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['kids_meal_type', 'condiments', 'meal_drinks', 'chips_sauce']
  },

  // CHICKEN
  {
    id: 'chic_breast',
    name: 'Chicken Breast',
    price: 5.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'chic_curry_meal',
    name: 'Chicken Curry',
    price: 10.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['chicken_curry_style']
  },
  {
    id: 'rice_side',
    name: 'Rice',
    price: 3.00,
    category: Category.SIDES,
    modifierGroupIds: ['chips_sauce']
  },

  // BITES
  {
    id: 'chic_strips',
    name: 'Chicken Strips (5 pcs)',
    price: 6.00,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'chic_nuggets',
    name: 'Chicken Nuggets (6 pcs)',
    price: 3.00,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'spicy_wings',
    name: 'Spicy Wings (6 pcs)',
    price: 5.00,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'battered_beef',
    name: 'Battered Beef',
    price: 4.50,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'custom_item',
    name: 'Custom Item',
    price: 0.00,
    category: Category.SIDES,
    modifierGroupIds: []
  },

  // SIDES & POTS
  {
    id: 'sauce_pot_main',
    name: 'Sauce Pot',
    price: 0,
    category: Category.POTS,
    modifierGroupIds: ['sauce_pot_type']
  },
  {
    id: 'dips_main',
    name: 'Dips',
    price: 0.50,
    category: Category.POTS,
    modifierGroupIds: ['dip_flavours']
  },
  {
    id: 'cheese_sticks',
    name: 'Breaded Cheese Sticks (6)',
    price: 5.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'jalapeno_cream',
    name: 'Jalapeno Cream Cheese (6)',
    price: 5.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'green_salad',
    name: 'Green Salad',
    price: 3.00,
    category: Category.SIDES,
    modifierGroupIds: ['salad', 'sauce']
  },
  {
    id: '14_bread_roll',
    name: 'Bread Roll',
    price: 1.00,
    category: Category.SIDES,
    modifierGroupIds: []
  },

  // Drinks - Updated
  {
    id: 'drinks_all',
    name: 'Drinks',
    price: 0,
    category: Category.DRINKS,
    modifierGroupIds: ['all_drinks_opt']
  }
];
