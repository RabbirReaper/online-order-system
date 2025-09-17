import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Menu from '../server/models/Menu/Menu.js'
import DishTemplate from '../server/models/Dish/DishTemplate.js'
import Bundle from '../server/models/Promotion/Bundle.js'
import OptionCategory from '../server/models/Dish/OptionCategory.js'
import Option from '../server/models/Dish/Option.js'

// 載入環境變數
dotenv.config()

// 檢查 MongoDB URL
console.log('MongoDB URL:', process.env.MongoDB_url)

mongoose
  .connect(process.env.MongoDB_url)
  .then(async () => {
    console.log('MongoDB connected')
    return await getMenuById('684d0afbba42aedb8f0e1da7')
  })
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((err) => {
    console.log('Error:', err)
    process.exit(1)
  })

async function getMenuById(menuId) {
  try {
    console.log(`\n=== 查詢 Menu ID: ${menuId} ===\n`)

    const menu = await Menu.findById(menuId).populate([
      {
        path: 'categories.items.dishTemplate',
        model: 'DishTemplate',
        select: 'name description basePrice image tags optionCategories',
        populate: {
          path: 'optionCategories.categoryId',
          model: 'OptionCategory',
          select: 'name inputType options',
          populate: {
            path: 'options.refOption',
            model: 'Option',
            select: 'name price tags refDishTemplate',
          },
        },
      },
      {
        path: 'categories.items.bundle',
        model: 'Bundle',
        select: 'name description image sellingPoint cashPrice pointPrice bundleItems',
        populate: {
          path: 'bundleItems.voucherTemplate',
          select: 'name description voucherType',
        },
      },
    ])

    if (!menu) {
      console.log('找不到指定的菜單')
      return
    }

    console.log('完整菜單資料：')
    console.log(JSON.stringify(menu, null, 2))

    // // 詳細展示 optionCategories 結構
    // console.log('\n=== OptionCategories 結構詳解 ===\n')

    // if (menu.categories && menu.categories.length > 0) {
    //   menu.categories.forEach((category, catIndex) => {
    //     console.log(`分類 ${catIndex + 1}: ${category.name}`)

    //     if (category.items && category.items.length > 0) {
    //       category.items.forEach((item, itemIndex) => {
    //         if (item.dishTemplate && item.dishTemplate.optionCategories) {
    //           console.log(`  餐點 ${itemIndex + 1}: ${item.dishTemplate.name}`)
    //           console.log(`    選項分類數量: ${item.dishTemplate.optionCategories.length}`)

    //           item.dishTemplate.optionCategories.forEach((optCat, optCatIndex) => {
    //             console.log(`    選項分類 ${optCatIndex + 1}:`)
    //             console.log(`      categoryId: ${optCat.categoryId._id}`)
    //             console.log(`      order: ${optCat.order}`)
    //             console.log(`      name: ${optCat.categoryId.name}`)
    //             console.log(`      inputType: ${optCat.categoryId.inputType}`)
    //             console.log(`      選項數量: ${optCat.categoryId.options.length}`)

    //             optCat.categoryId.options.forEach((option, optIndex) => {
    //               console.log(`        選項 ${optIndex + 1}:`)
    //               console.log(`          refOption: ${option.refOption._id}`)
    //               console.log(`          order: ${option.order}`)
    //               console.log(`          name: ${option.refOption.name}`)
    //               console.log(`          price: ${option.refOption.price}`)
    //               console.log(`          tags: ${JSON.stringify(option.refOption.tags)}`)
    //             })
    //           })
    //         }
    //       })
    //     }
    //   })
    // }

    return menu
  } catch (error) {
    console.error('查詢菜單時發生錯誤:', error)
    throw error
  }
}
