const fs = require('fs');
const path = './src/constants.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '{ name: "Fruit Shoot Blackcurrant", price: 1.50 },\n      { name: "Fruit Shoot Orange", price: 1.50 }',
  '{ name: "Fruit Shoot Blackcurrant", price: 1.00 },\n      { name: "Fruit Shoot Orange", price: 1.00 }'
);

content = content.replace(
  `  {
    id: 'chic_curry_meal',
    name: 'Chicken Curry',
    price: 10.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['chicken_curry_style']
  },

  // BITES`,
  `  {
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
    modifierGroupIds: []
  },

  // BITES`
);

fs.writeFileSync(path, content);

const gridPath = './src/components/MenuGrid.tsx';
let gridContent = fs.readFileSync(gridPath, 'utf8');

gridContent = gridContent.replace(
  "const col1Names = ['Chicken Breast', 'Chicken Curry', 'empty', 'empty', 'Drinks'];",
  "const col1Names = ['Chicken Breast', 'Chicken Curry', 'Rice', 'empty', 'Drinks'];"
);

fs.writeFileSync(gridPath, gridContent);
console.log('Done');
