import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 載入環境變數
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseUrl = 'https://auth.uber.com/oauth/v2/token'
const BaseUrl = 'https://api.uber.com/v2/eats/stores'
const clientId = process.env.UBEREATS_PRODUCTION_CLIENT_ID
const secret = process.env.UBEREATS_PRODUCTION_CLIENT_SECRET
const testStoreId = 'd641fef3-0fb5-408c-b20a-d65b3c082530'

// 您的完整菜單資料
const fullMenuData = {
  _id: '684d0afbba42aedb8f0e1da7',
  name: '瀋陽店',
  menuType: 'food',
  store: '6818d78db0d9e9f313335aed',
  brand: '6818d68ab0d9e9f313335aa3',
  categories: [
    {
      name: '牛排類',
      description: '',
      order: 0,
      items: [
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/c085d229-ad40-4ab3-ade7-d97bda9f74d0.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/c085d229-ad40-4ab3-ade7-d97bda9f74d0.jpeg',
              alt: 'picture',
            },
            _id: '6818dbdeb0d9e9f31333605b',
            name: '厚切原塊炭烤牛排',
            basePrice: 240,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 0,
                _id: '6818dbdeb0d9e9f31333605d',
              },
              {
                categoryId: {
                  _id: '6818d8feb0d9e9f313335c5c',
                  name: '熟度',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d833b0d9e9f313335b7f',
                        name: '5分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d90db0d9e9f313335c7b',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d838b0d9e9f313335b8e',
                        name: '7分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d90db0d9e9f313335c7c',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d840b0d9e9f313335b9f',
                        name: '9分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d90db0d9e9f313335c7d',
                    },
                  ],
                },
                order: 1,
                _id: '6818dbdeb0d9e9f31333605c',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 2,
                _id: '6818dbdeb0d9e9f31333605e',
              },
              {
                categoryId: {
                  _id: '681a0ed4eedfadb118b267b8',
                  name: '擠爆雙倍牛',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        _id: '681a0ae1b0d9e9f3133392e9',
                        name: '+厚切原塊炭烤牛排',
                        refDishTemplate: '6818dbdeb0d9e9f31333605b',
                        price: 180,
                        tags: ['加料'],
                      },
                      order: 0,
                      _id: '681a0efdeedfadb118b267e2',
                    },
                    {
                      refOption: {
                        _id: '681a0b2cb0d9e9f31333931d',
                        name: '+大丈夫炭烤牛排',
                        refDishTemplate: '6818dc58b0d9e9f3133361b2',
                        price: 360,
                        tags: ['加料'],
                      },
                      order: 1,
                      _id: '681a0efdeedfadb118b267e3',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b59b0d9e9f31333933e',
                        name: '+天使香脆雞腿排',
                        refDishTemplate: '6818db8cb0d9e9f313335f4f',
                        price: 150,
                      },
                      order: 2,
                      _id: '681a0efdeedfadb118b267e4',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b61b0d9e9f313339362',
                        name: '+岩漿起司豬排',
                        refDishTemplate: '6818dbb3b0d9e9f313335fc4',
                        price: 155,
                      },
                      order: 3,
                      _id: '681a0efdeedfadb118b267e5',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b7ab0d9e9f313339389',
                        name: '+極鮮檸檬鱈魚排(每日限量)',
                        refDishTemplate: '6818dd12b0d9e9f3133362a0',
                        price: 120,
                      },
                      order: 4,
                      _id: '681a0efdeedfadb118b267e6',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0e93eedfadb118b2676d',
                        name: '+炙燒炭烤牛排\t\t\t\t',
                        refDishTemplate: '6818d80bb0d9e9f313335b53',
                        price: 155,
                      },
                      order: 5,
                      _id: '681a0efdeedfadb118b267e7',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0eaceedfadb118b26795',
                        name: '+蛋蛋恰可豬排',
                        refDishTemplate: '6818db4ab0d9e9f313335ef5',
                        price: 110,
                      },
                      order: 6,
                      _id: '681a0efdeedfadb118b267e8',
                    },
                  ],
                },
                order: 3,
                _id: '6825e6c0966030343979c3bd',
              },
            ],
            description:
              '產地:紐西蘭\n部位:老饕Ribeye Cap\n\n老饕牛排看起來像蓋子，也被稱為「上蓋肉」。他兼具嫩度與油花，風味十足。一頭牛只能做十二份八盎司的老饕牛排。\n\n老饕牛肉取至牛之肩背下方、特別在肋眼尚再細切分出的一條上蓋肉，嫩度絕佳。『這塊肉是精華中的精華』招牌商品店主推薦\n\n建議熟度七分',
            tags: ['beef'],
          },
          isShowing: true,
          order: 0,
          _id: '684d0afbba42aedb8f0e1da9',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/4c00973c-8014-4548-9e86-52b053633490.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/4c00973c-8014-4548-9e86-52b053633490.jpeg',
              alt: 'picture',
            },
            _id: '6818dc58b0d9e9f3133361b2',
            name: '大丈夫炭烤牛排',
            basePrice: 430,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8feb0d9e9f313335c5c',
                  name: '熟度',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d833b0d9e9f313335b7f',
                        name: '5分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d90db0d9e9f313335c7b',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d838b0d9e9f313335b8e',
                        name: '7分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d90db0d9e9f313335c7c',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d840b0d9e9f313335b9f',
                        name: '9分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d90db0d9e9f313335c7d',
                    },
                  ],
                },
                order: 0,
                _id: '6818dc58b0d9e9f3133361b3',
              },
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 1,
                _id: '6818dc58b0d9e9f3133361b4',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 2,
                _id: '6818dc58b0d9e9f3133361b5',
              },
              {
                categoryId: {
                  _id: '681a0ed4eedfadb118b267b8',
                  name: '擠爆雙倍牛',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        _id: '681a0ae1b0d9e9f3133392e9',
                        name: '+厚切原塊炭烤牛排',
                        refDishTemplate: '6818dbdeb0d9e9f31333605b',
                        price: 180,
                        tags: ['加料'],
                      },
                      order: 0,
                      _id: '681a0efdeedfadb118b267e2',
                    },
                    {
                      refOption: {
                        _id: '681a0b2cb0d9e9f31333931d',
                        name: '+大丈夫炭烤牛排',
                        refDishTemplate: '6818dc58b0d9e9f3133361b2',
                        price: 360,
                        tags: ['加料'],
                      },
                      order: 1,
                      _id: '681a0efdeedfadb118b267e3',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b59b0d9e9f31333933e',
                        name: '+天使香脆雞腿排',
                        refDishTemplate: '6818db8cb0d9e9f313335f4f',
                        price: 150,
                      },
                      order: 2,
                      _id: '681a0efdeedfadb118b267e4',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b61b0d9e9f313339362',
                        name: '+岩漿起司豬排',
                        refDishTemplate: '6818dbb3b0d9e9f313335fc4',
                        price: 155,
                      },
                      order: 3,
                      _id: '681a0efdeedfadb118b267e5',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b7ab0d9e9f313339389',
                        name: '+極鮮檸檬鱈魚排(每日限量)',
                        refDishTemplate: '6818dd12b0d9e9f3133362a0',
                        price: 120,
                      },
                      order: 4,
                      _id: '681a0efdeedfadb118b267e6',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0e93eedfadb118b2676d',
                        name: '+炙燒炭烤牛排\t\t\t\t',
                        refDishTemplate: '6818d80bb0d9e9f313335b53',
                        price: 155,
                      },
                      order: 5,
                      _id: '681a0efdeedfadb118b267e7',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0eaceedfadb118b26795',
                        name: '+蛋蛋恰可豬排',
                        refDishTemplate: '6818db4ab0d9e9f313335ef5',
                        price: 110,
                      },
                      order: 6,
                      _id: '681a0efdeedfadb118b267e8',
                    },
                  ],
                },
                order: 3,
                _id: '6825e6e3966030343979c490',
              },
            ],
            description:
              '產地:美國\n部位:下肩胛眼肉Chuck eye\n\n選自美國PRIME最頂級肉品超大尺寸16盎司！！！醃製後由花部分超好吃，店主推薦\n\n肩胛部切離而得(含三根頸椎骨第5到7頸椎骨、去唇肉、肩峰肉)，一條約6-8公斤。牛梅花大多精瘦柔嫩且富含大理石油花，靠近頸部部位較硬，靠近肋脊部較嫩。',
            tags: ['beef'],
          },
          isShowing: true,
          order: 1,
          _id: '684d0afbba42aedb8f0e1daa',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/583f622e-7450-4276-839f-5af3a14c65d8.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/583f622e-7450-4276-839f-5af3a14c65d8.jpeg',
              alt: 'picture',
            },
            _id: '6818d80bb0d9e9f313335b53',
            name: '炙燒炭烤牛排',
            basePrice: 230,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8feb0d9e9f313335c5c',
                  name: '熟度',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d833b0d9e9f313335b7f',
                        name: '5分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d90db0d9e9f313335c7b',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d838b0d9e9f313335b8e',
                        name: '7分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d90db0d9e9f313335c7c',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d840b0d9e9f313335b9f',
                        name: '9分熟',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d90db0d9e9f313335c7d',
                    },
                  ],
                },
                order: 0,
                _id: '6818d9e9b0d9e9f313335e1c',
              },
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 1,
                _id: '6818d9e9b0d9e9f313335e1d',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 2,
                _id: '6818d9e9b0d9e9f313335e1e',
              },
              {
                categoryId: {
                  _id: '681a0ed4eedfadb118b267b8',
                  name: '擠爆雙倍牛',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        _id: '681a0ae1b0d9e9f3133392e9',
                        name: '+厚切原塊炭烤牛排',
                        refDishTemplate: '6818dbdeb0d9e9f31333605b',
                        price: 180,
                        tags: ['加料'],
                      },
                      order: 0,
                      _id: '681a0efdeedfadb118b267e2',
                    },
                    {
                      refOption: {
                        _id: '681a0b2cb0d9e9f31333931d',
                        name: '+大丈夫炭烤牛排',
                        refDishTemplate: '6818dc58b0d9e9f3133361b2',
                        price: 360,
                        tags: ['加料'],
                      },
                      order: 1,
                      _id: '681a0efdeedfadb118b267e3',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b59b0d9e9f31333933e',
                        name: '+天使香脆雞腿排',
                        refDishTemplate: '6818db8cb0d9e9f313335f4f',
                        price: 150,
                      },
                      order: 2,
                      _id: '681a0efdeedfadb118b267e4',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b61b0d9e9f313339362',
                        name: '+岩漿起司豬排',
                        refDishTemplate: '6818dbb3b0d9e9f313335fc4',
                        price: 155,
                      },
                      order: 3,
                      _id: '681a0efdeedfadb118b267e5',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b7ab0d9e9f313339389',
                        name: '+極鮮檸檬鱈魚排(每日限量)',
                        refDishTemplate: '6818dd12b0d9e9f3133362a0',
                        price: 120,
                      },
                      order: 4,
                      _id: '681a0efdeedfadb118b267e6',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0e93eedfadb118b2676d',
                        name: '+炙燒炭烤牛排\t\t\t\t',
                        refDishTemplate: '6818d80bb0d9e9f313335b53',
                        price: 155,
                      },
                      order: 5,
                      _id: '681a0efdeedfadb118b267e7',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0eaceedfadb118b26795',
                        name: '+蛋蛋恰可豬排',
                        refDishTemplate: '6818db4ab0d9e9f313335ef5',
                        price: 110,
                      },
                      order: 6,
                      _id: '681a0efdeedfadb118b267e8',
                    },
                  ],
                },
                order: 3,
                _id: '6828806f4a482a0f1036e09b',
              },
            ],
            description:
              '產地:紐西蘭\n\n部位:PS嫩肩去骨牛排\n\n一般穀飼牛肉因帶油花，嚐來固然甘味，但往往少了迷人嚼勁與豐郁馨香的牛肉香氣。\n\n紐西蘭草飼牛肉宛如「放山牛」的肉質，緊緻富嚼勁，吃起來不容易膩口，也更能忠實呈現天然牛肉最迷人的鮮香風味，又能維持精嫩、入口即化的口感，非常適合挑嘴的您。\n\n建議熟度五分',
            tags: [],
          },
          isShowing: true,
          order: 2,
          _id: '685056e2292419541dfdfbfd',
        },
      ],
      _id: '684d0afbba42aedb8f0e1da8',
    },
    {
      name: '不想吃牛',
      description: '',
      order: 1,
      items: [
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/2dd1fb60-8369-4d10-ad46-f9fb14b7fe0b.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/2dd1fb60-8369-4d10-ad46-f9fb14b7fe0b.jpeg',
              alt: 'picture',
            },
            _id: '6818db8cb0d9e9f313335f4f',
            name: '天使香脆雞腿排',
            basePrice: 210,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 0,
                _id: '6818db8cb0d9e9f313335f50',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 1,
                _id: '6818db8cb0d9e9f313335f51',
              },
              {
                categoryId: {
                  _id: '681a0ed4eedfadb118b267b8',
                  name: '擠爆雙倍牛',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        _id: '681a0ae1b0d9e9f3133392e9',
                        name: '+厚切原塊炭烤牛排',
                        refDishTemplate: '6818dbdeb0d9e9f31333605b',
                        price: 180,
                        tags: ['加料'],
                      },
                      order: 0,
                      _id: '681a0efdeedfadb118b267e2',
                    },
                    {
                      refOption: {
                        _id: '681a0b2cb0d9e9f31333931d',
                        name: '+大丈夫炭烤牛排',
                        refDishTemplate: '6818dc58b0d9e9f3133361b2',
                        price: 360,
                        tags: ['加料'],
                      },
                      order: 1,
                      _id: '681a0efdeedfadb118b267e3',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b59b0d9e9f31333933e',
                        name: '+天使香脆雞腿排',
                        refDishTemplate: '6818db8cb0d9e9f313335f4f',
                        price: 150,
                      },
                      order: 2,
                      _id: '681a0efdeedfadb118b267e4',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b61b0d9e9f313339362',
                        name: '+岩漿起司豬排',
                        refDishTemplate: '6818dbb3b0d9e9f313335fc4',
                        price: 155,
                      },
                      order: 3,
                      _id: '681a0efdeedfadb118b267e5',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b7ab0d9e9f313339389',
                        name: '+極鮮檸檬鱈魚排(每日限量)',
                        refDishTemplate: '6818dd12b0d9e9f3133362a0',
                        price: 120,
                      },
                      order: 4,
                      _id: '681a0efdeedfadb118b267e6',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0e93eedfadb118b2676d',
                        name: '+炙燒炭烤牛排\t\t\t\t',
                        refDishTemplate: '6818d80bb0d9e9f313335b53',
                        price: 155,
                      },
                      order: 5,
                      _id: '681a0efdeedfadb118b267e7',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0eaceedfadb118b26795',
                        name: '+蛋蛋恰可豬排',
                        refDishTemplate: '6818db4ab0d9e9f313335ef5',
                        price: 110,
                      },
                      order: 6,
                      _id: '681a0efdeedfadb118b267e8',
                    },
                  ],
                },
                order: 2,
                _id: '6825e6f2966030343979c529',
              },
            ],
            description:
              '產地:台灣\n部位:雞腿肉\n嚴選去骨雞腿肉為原料，透過獨家配方精心調製入味，調理後香煎出金黃酥脆的外皮搭配鮮嫩多汁的雞腿肉，讓人忍不住食指大動，高CP值店主推薦。\n雞腿與辣味雞腿為每日新鮮直送現煎溫體雞，限量供應',
            tags: [],
          },
          isShowing: true,
          order: 0,
          _id: '685056e2292419541dfdfbff',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/f771862e-e57b-479f-b05e-9d402a5cc8be.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/f771862e-e57b-479f-b05e-9d402a5cc8be.jpeg',
              alt: 'picture',
            },
            _id: '6818dbb3b0d9e9f313335fc4',
            name: '岩漿起司豬排',
            basePrice: 220,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 0,
                _id: '6818dbb3b0d9e9f313335fc5',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 1,
                _id: '6818dbb3b0d9e9f313335fc6',
              },
              {
                categoryId: {
                  _id: '681a0ed4eedfadb118b267b8',
                  name: '擠爆雙倍牛',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        _id: '681a0ae1b0d9e9f3133392e9',
                        name: '+厚切原塊炭烤牛排',
                        refDishTemplate: '6818dbdeb0d9e9f31333605b',
                        price: 180,
                        tags: ['加料'],
                      },
                      order: 0,
                      _id: '681a0efdeedfadb118b267e2',
                    },
                    {
                      refOption: {
                        _id: '681a0b2cb0d9e9f31333931d',
                        name: '+大丈夫炭烤牛排',
                        refDishTemplate: '6818dc58b0d9e9f3133361b2',
                        price: 360,
                        tags: ['加料'],
                      },
                      order: 1,
                      _id: '681a0efdeedfadb118b267e3',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b59b0d9e9f31333933e',
                        name: '+天使香脆雞腿排',
                        refDishTemplate: '6818db8cb0d9e9f313335f4f',
                        price: 150,
                      },
                      order: 2,
                      _id: '681a0efdeedfadb118b267e4',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b61b0d9e9f313339362',
                        name: '+岩漿起司豬排',
                        refDishTemplate: '6818dbb3b0d9e9f313335fc4',
                        price: 155,
                      },
                      order: 3,
                      _id: '681a0efdeedfadb118b267e5',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0b7ab0d9e9f313339389',
                        name: '+極鮮檸檬鱈魚排(每日限量)',
                        refDishTemplate: '6818dd12b0d9e9f3133362a0',
                        price: 120,
                      },
                      order: 4,
                      _id: '681a0efdeedfadb118b267e6',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0e93eedfadb118b2676d',
                        name: '+炙燒炭烤牛排\t\t\t\t',
                        refDishTemplate: '6818d80bb0d9e9f313335b53',
                        price: 155,
                      },
                      order: 5,
                      _id: '681a0efdeedfadb118b267e7',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '681a0eaceedfadb118b26795',
                        name: '+蛋蛋恰可豬排',
                        refDishTemplate: '6818db4ab0d9e9f313335ef5',
                        price: 110,
                      },
                      order: 6,
                      _id: '681a0efdeedfadb118b267e8',
                    },
                  ],
                },
                order: 2,
                _id: '6825e713966030343979c5dd',
              },
            ],
            description:
              '產地:西班牙/英國\n部位:里肌肉/特級乳酪\n\n嚴選世界上最好的豬肉伊比利豬製成，肉質細膩可口\n配上獨特醃料，跳脫以往常見的日式豬肉口味，絕對讓您有不同的全新感受\n莫札瑞拉起司配上奶油調色調味保留原始口感與乳香，起司控的你千萬別錯過。',
            tags: [],
          },
          isShowing: true,
          order: 1,
          _id: '685056e2292419541dfdfc00',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/fe5ebb38-e382-46ac-a0a9-61fe0ac0a948.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/fe5ebb38-e382-46ac-a0a9-61fe0ac0a948.jpeg',
              alt: 'picture',
            },
            _id: '6818dd12b0d9e9f3133362a0',
            name: '極鮮檸檬鱈魚排(每日限量)',
            basePrice: 180,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 0,
                _id: '6818dd12b0d9e9f3133362a1',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 1,
                _id: '6818dd12b0d9e9f3133362a2',
              },
            ],
            description:
              '🍋極鮮檸檬鱈魚排🐟\n來一口細緻嫩滑的鱈魚排，感受大海的鮮甜！✨\n外皮微煎至金黃，內裡軟嫩多汁，搭配新鮮檸檬舟，微酸點綴讓鮮味更上一層樓！💛\n\n🌊 來自純淨海域的高品質鱈魚\n🔥 簡單調味，保留原始鮮甜\n🍽 低脂高蛋白，健康無負擔\n\n📍 美味即刻品嚐，一口就愛上！💖\n\n\n\n排餐附送麵,包,蛋',
            tags: [],
          },
          isShowing: true,
          order: 2,
          _id: '685056e2292419541dfdfc01',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/baaae07c-c105-48ed-99f2-08ce2b7c2d43.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/baaae07c-c105-48ed-99f2-08ce2b7c2d43.jpeg',
              alt: 'picture',
            },
            _id: '6818db4ab0d9e9f313335ef5',
            name: '蛋蛋恰可豬排',
            basePrice: 160,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 0,
                _id: '6818db4ab0d9e9f313335ef6',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 1,
                _id: '6818db4ab0d9e9f313335ef7',
              },
            ],
            description:
              '產地:伊比利\n部位:里肌肉\n\n嚴選世界上最好的豬肉伊比利豬製成，肉質細膩可口\n配上獨特醃料，跳脫以往常見的日式豬肉口味，絕對讓您有不同的全新感受\n\n伊比利豬有「世界上最好吃的豬肉」美稱，可說是西班牙國寶級食材。伊比利豬生長於西班牙南部及西南部，血緣與野豬相近，經過千年來的混種、地中海獨特氣候與特殊飼養方式，使其生長為最尊貴的豬種。講究來說，基因純度得75％以上才稱得上是「伊比利豬」。\n\n選用伊比利豬自幼年即被放養野外，以野草、香草及橄欖等維生，到了8∼10個月大時進入肥育期，此時也是橡樹果實盛產季，肥育期間大量食用橡實，經過檢驗證實，其脂肪成份多為與橄欖油類似的不飽和脂肪酸，因此伊比利豬又被稱為「會走路的橄欖樹」。',
            tags: [],
          },
          isShowing: true,
          order: 3,
          _id: '685056e2292419541dfdfc02',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/97f81fa3-228d-4f71-89bb-e6e101f7f15d.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/97f81fa3-228d-4f71-89bb-e6e101f7f15d.jpeg',
              alt: 'picture',
            },
            _id: '6818dc9db0d9e9f3133361f0',
            name: '鐵板麵',
            basePrice: 100,
            optionCategories: [
              {
                categoryId: {
                  _id: '6818d8d8b0d9e9f313335c36',
                  name: '醬料',
                  inputType: 'single',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d823b0d9e9f313335b5e',
                        name: '蘑菇醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d8f6b0d9e9f313335c45',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d829b0d9e9f313335b67',
                        name: '黑胡椒醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d8f6b0d9e9f313335c46',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d82eb0d9e9f313335b72',
                        name: '綜合醬',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d8f6b0d9e9f313335c47',
                    },
                  ],
                },
                order: 0,
                _id: '6818dc9db0d9e9f3133361f1',
              },
              {
                categoryId: {
                  _id: '6818d93ab0d9e9f313335cab',
                  name: '額外要求',
                  inputType: 'multiple',
                  options: [
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d84eb0d9e9f313335bb2',
                        name: '麵加量',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 0,
                      _id: '6818d972b0d9e9f313335ce8',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d85bb0d9e9f313335bc7',
                        name: '麵換蛋',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 1,
                      _id: '6818d972b0d9e9f313335ce9',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d864b0d9e9f313335bde',
                        name: '麵換花椰菜',
                        refDishTemplate: null,
                        price: 0,
                      },
                      order: 2,
                      _id: '6818d972b0d9e9f313335cea',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d89ab0d9e9f313335bf7',
                        name: '+莫札瑞拉起司',
                        refDishTemplate: null,
                        price: 80,
                      },
                      order: 3,
                      _id: '6818d972b0d9e9f313335ceb',
                    },
                    {
                      refOption: {
                        tags: [],
                        _id: '6818d8a5b0d9e9f313335c12',
                        name: '+蛋',
                        refDishTemplate: null,
                        price: 20,
                      },
                      order: 4,
                      _id: '6818d972b0d9e9f313335cec',
                    },
                  ],
                },
                order: 1,
                _id: '6818dc9db0d9e9f3133361f2',
              },
            ],
            description: '跳脫以往傳統牛排所使用的扁麵，選用價格偏高的小拉麵，口感更為Q彈順口。',
            tags: [],
          },
          isShowing: true,
          order: 4,
          _id: '685056e2292419541dfdfc03',
        },
      ],
      _id: '685056e2292419541dfdfbfe',
    },
    {
      name: '精緻附餐',
      description: '',
      order: 2,
      items: [
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/dc725998-33a4-46f5-b47e-ef30f0b78baa.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/dc725998-33a4-46f5-b47e-ef30f0b78baa.jpeg',
              alt: 'picture',
            },
            _id: '6818dccdb0d9e9f31333623b',
            name: '香蒜麵包',
            basePrice: 55,
            optionCategories: [],
            description:
              '融化牛油配上獨特調味熱炒蒜碎等待凝固均勻塗抹在法式麵包上再以中火慢烤外酥內軟、香味四溢\n\n一份2顆、排餐均有附送',
            tags: [],
          },
          isShowing: true,
          order: 0,
          _id: '685056e2292419541dfdfc05',
        },
        {
          itemType: 'dish',
          dishTemplate: {
            image: {
              url: 'https://pub-e2700a21e03b4e26a8bafd4546249408.r2.dev/dishes/6818d68ab0d9e9f313335aa3/8701dbd1-edd4-45cc-8021-0beacd7293be.jpeg',
              key: 'dishes/6818d68ab0d9e9f313335aa3/8701dbd1-edd4-45cc-8021-0beacd7293be.jpeg',
              alt: 'picture',
            },
            _id: '6818da8ab0d9e9f313335e8d',
            name: '牽絲焗烤麵包',
            basePrice: 80,
            optionCategories: [],
            description:
              '融化牛油配上獨特調味熱炒蒜碎等待凝固均勻塗抹在法式麵包上再以中火慢烤外酥內軟、香味四溢\n\n莫札瑞拉起司配上奶油調色調味保留原始口感與乳香，起司控的你千萬別錯過。',
            tags: [],
          },
          isShowing: true,
          order: 1,
          _id: '685056e2292419541dfdfc06',
        },
      ],
      _id: '685056e2292419541dfdfc04',
    },
  ],
  isActive: true,
  createdAt: '2025-06-14T05:39:07.757Z',
  updatedAt: '2025-08-13T10:29:25.547Z',
  __v: 1,
}

const getAccessToken = async () => {
  try {
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      grant_type: 'client_credentials',
      scope: 'eats.store eats.order eats.store.status.write',
    })

    const response = await axios.post(baseUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data.access_token
  } catch (error) {
    console.error('獲取 Access Token 失敗:', error.response?.data || error.message)
    throw error
  }
}

/**
 * 轉換您的菜單資料為 Uber Eats 格式
 */
function convertToUberEatsFormat(fullMenuData) {
  // console.log('開始轉換菜單資料...')

  const result = {
    menus: [],
    categories: [],
    items: [],
    modifier_groups: [],
  }

  // 用於追踪已處理的 modifier groups，避免重複
  const processedModifierGroups = new Set()

  // 建立主菜單 - 使用官方格式
  const mainMenu = {
    id: fullMenuData._id,
    title: {
      translations: {
        en_us: fullMenuData.name,
        zh_tw: fullMenuData.name,
      },
    },
    service_availability: [
      {
        day_of_week: 'monday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'tuesday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'wednesday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'thursday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'friday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'saturday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
      {
        day_of_week: 'sunday',
        time_periods: [{ start_time: '00:00', end_time: '23:59' }],
      },
    ],
    category_ids: [],
  }

  // 處理分類和商品
  fullMenuData.categories.forEach((category) => {
    const categoryId = category._id

    // 轉換分類格式 - 使用官方格式
    const uberCategory = {
      id: categoryId,
      title: {
        translations: {
          en_us: category.name,
          zh_tw: category.name,
        },
      },
      entities: [],
    }

    // 處理該分類下的商品
    category.items.forEach((item) => {
      if (!item.isShowing) return // 跳過不顯示的商品

      const dishTemplate = item.dishTemplate
      const itemId = dishTemplate._id

      // 轉換商品格式 - 使用官方格式
      const uberItem = {
        id: itemId,
        title: {
          translations: {
            en_us: dishTemplate.name,
            zh_tw: dishTemplate.name,
          },
        },
        description: {
          translations: {
            en_us: dishTemplate.description || '',
            zh_tw: dishTemplate.description || '',
          },
        },
        price_info: {
          price: dishTemplate.basePrice * 100, // 轉換為分
        },
        tax_info: {},
        external_data: `External data for ${dishTemplate.name}`,
        quantity_info: {},
      }

      // 添加圖片（如果有的話）
      if (dishTemplate.image?.url) {
        uberItem.image_url = dishTemplate.image.url
      }

      // 處理選項群組 - 使用官方格式
      if (dishTemplate.optionCategories && dishTemplate.optionCategories.length > 0) {
        const modifierGroupIds = []

        dishTemplate.optionCategories.forEach((optionCategory) => {
          const modifierGroupId = optionCategory.categoryId._id
          modifierGroupIds.push(modifierGroupId)

          // 如果還未處理過這個 modifier group，則加入到結果中
          if (!processedModifierGroups.has(modifierGroupId)) {
            const modifierGroup = convertToModifierGroup(optionCategory.categoryId)
            result.modifier_groups.push(modifierGroup)
            processedModifierGroups.add(modifierGroupId)
          }
        })

        // 使用正確的格式
        if (modifierGroupIds.length > 0) {
          uberItem.modifier_group_ids = { ids: modifierGroupIds }
        }
      }

      result.items.push(uberItem)
      uberCategory.entities.push({
        id: itemId,
        type: 'ITEM',
      })
    })

    result.categories.push(uberCategory)
    mainMenu.category_ids.push(categoryId)
  })

  result.menus.push(mainMenu)

  // ⭐ 重要：添加 modifier items 到 items 陣列
  const modifierItems = createModifierItems(fullMenuData)
  result.items.push(...modifierItems)

  // console.log(`轉換完成:`)
  // console.log(`- 菜單: ${result.menus.length} 個`)
  // console.log(`- 分類: ${result.categories.length} 個`)
  // console.log(`- 主要商品: ${result.items.length - modifierItems.length} 個`)
  // console.log(`- 選項商品: ${modifierItems.length} 個`)
  // console.log(`- 總商品數: ${result.items.length} 個`)
  // console.log(`- 選項群組: ${result.modifier_groups.length} 個`)

  return result
}

/**
 * 轉換選項群組為 Uber Eats modifier_group 格式
 */
function convertToModifierGroup(optionCategory) {
  const modifierGroup = {
    id: optionCategory._id,
    title: {
      translations: {
        en_us: optionCategory.name,
        zh_tw: optionCategory.name,
      },
    },
    external_data: `External data for ${optionCategory.name}`,
    modifier_options: [],
    display_type: null,
  }

  // 設定數量限制 - 使用官方格式
  if (optionCategory.inputType === 'single') {
    modifierGroup.quantity_info = {
      quantity: {
        min_permitted: 1,
        max_permitted: 1,
      },
    }
  } else if (optionCategory.inputType === 'multiple') {
    modifierGroup.quantity_info = {
      quantity: {
        min_permitted: 0,
        max_permitted: optionCategory.options.length,
      },
    }
  }

  // 轉換選項 - 使用官方格式
  optionCategory.options.forEach((option) => {
    // 將選項作為引用添加到 modifier_options
    modifierGroup.modifier_options.push({
      type: 'ITEM',
      id: option.refOption._id,
    })
  })

  return modifierGroup
}

/**
 * 創建選項商品 (將 modifier 選項轉為 items)
 */
function createModifierItems(fullMenuData) {
  const modifierItems = []
  const processedOptionIds = new Set()

  fullMenuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      if (!item.isShowing || !item.dishTemplate.optionCategories) return

      item.dishTemplate.optionCategories.forEach((optionCategory) => {
        optionCategory.categoryId.options.forEach((option) => {
          const optionId = option.refOption._id

          // 避免重複創建相同的選項
          if (processedOptionIds.has(optionId)) return
          processedOptionIds.add(optionId)

          const modifierItem = {
            id: optionId,
            title: {
              translations: {
                en_us: option.refOption.name,
                zh_tw: option.refOption.name,
              },
            },
            external_data: `External data for ${option.refOption.name}`,
            price_info: {
              price: (option.refOption.price || 0) * 100, // 轉換為分
            },
            tax_info: {},
            quantity_info: {},
          }

          // 如果有標籤，加入標籤資訊
          if (option.refOption.tags && option.refOption.tags.length > 0) {
            modifierItem.tags = option.refOption.tags
          }

          modifierItems.push(modifierItem)
        })
      })
    })
  })

  return modifierItems
}

/**
 * 上傳菜單到 Uber Eats
 */
const uploadMenu = async (accessToken, storeId, menuData) => {
  try {
    if (menuData.items[0]?.modifier_group_ids) {
      // console.log(
      //   '- modifier_group_ids 格式:',
      //   JSON.stringify(menuData.items[0]?.modifier_group_ids, null, 2),
      // )
    }
    if (menuData.modifier_groups[0]) {
      // console.log(
      //   '- 選項群組格式:',
      //   JSON.stringify(
      //     {
      //       id: menuData.modifier_groups[0].id,
      //       title: menuData.modifier_groups[0].title,
      //       quantity_info: menuData.modifier_groups[0].quantity_info,
      //       modifier_options: menuData.modifier_groups[0].modifier_options,
      //     },
      //     null,
      //     2,
      //   ),
      // )
    }

    const response = await axios.put(`${BaseUrl}/${storeId}/menus`, menuData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 秒超時
    })

    return { success: true, data: response.data }
  } catch (error) {
    console.error('上傳菜單失敗:', error.response?.data || error.message)

    if (error.response?.status === 400) {
      console.error('請求格式錯誤，請檢查菜單資料格式')
    } else if (error.response?.status === 401) {
      console.error('認證失敗，請檢查 Access Token')
    } else if (error.response?.status === 403) {
      console.error('權限不足，請檢查 API 權限設定')
    }

    throw error
  }
}

/**
 * 取得現有菜單
 */
const getMenu = async (accessToken, storeId) => {
  try {
    const response = await axios.get(`${BaseUrl}/${storeId}/menus`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    // console.log(response.data)
    return response.data
  } catch (error) {
    console.error('取得菜單失敗:', error.response?.data || error.message)
    return null
  }
}

const updateItem = async (accessToken, storeId, itemId, itemData) => {
  try {
    const response = await axios.post(`${BaseUrl}/${storeId}/menus/items/${itemId}`, itemData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    console.error('更新商品失敗:', error.response?.data || error.message)
    return null
  }
}

/**
 * 主函數
 */
const main = async () => {
  try {
    const token = await getAccessToken()

    if (!token) {
      throw new Error('無法獲取 Access Token')
    }

    // 4. 取得現有菜單（可選）
    // console.log('4. 取得現有菜單...')
    // const existingMenu = await getMenu(token, testStoreId)
    // if (existingMenu) {
    //   console.log('✓ 現有菜單取得成功')
    //   console.log(`  現有商品數量: ${existingMenu.items?.length || 0}`)
    // } else {
    //   console.log('! 沒有現有菜單或取得失敗')
    // }

    const convertedMenuData = convertToUberEatsFormat(fullMenuData)
    console.log('✓ 菜單資料轉換完成\n')
    await uploadMenu(token, testStoreId, convertedMenuData)

    // await updateItem(token, testStoreId, '6818dccdb0d9e9f31333623b', {
    //   suspension_info: {
    //     suspension: {
    //       suspend_until: 8640000000, // 設定為一個很遠的未來時間
    //       reason: null,
    //     },
    //   },
    // })
    const menuRes = await getMenu(token, testStoreId)
    console.log(
      menuRes.items.find((item) => item.id === '6818dccdb0d9e9f31333623b').suspension_info,
    )
  } catch (error) {
    console.error('\n❌ 程序執行失敗:')
    console.error(error.message)

    if (error.response?.data) {
      console.error('\nAPI 錯誤詳情:')
      console.error(JSON.stringify(error.response.data, null, 2))
    }
  }
}

main()
