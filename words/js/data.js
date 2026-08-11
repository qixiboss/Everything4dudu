/* ============================================================
 * Module: Data
 * 新增词汇、短文或词集时，可修改 sets，或在 App 初始化前调用
 * addWords / addParagraphs / addSet；页面按钮、目录和词数会自动生成。
 *
 * 数据模型：
 *   set → column → words / paragraphs → segments
 * segment 是普通字符串或 { vocabId, text }。后者同时承担“文章高亮”和
 * “跳转到词卡数据”的关联键；audio.cues 则与运行时拆出的文章 token 一一对应。
 * ============================================================ */
WordTales.Data = (function() {
  var sets = [
  {
    "id": "set1",
    "number": 1,
    "label": "第一份",
    "columns": [
      {
        "id": "s1col1",
        "number": 1,
        "audio": {
          "src": "audio/list1_col1.mp3",
          "cues": [[0,0.16],[0.16,0.5],[0.5,1.02],[1.02,1.54],[1.54,1.88],[1.88,2.36],[2.36,2.62],[2.62,2.78],[2.78,3.1],null,[3.62,3.76],[3.76,4.12],[4.12,4.64],[4.64,4.9],[4.9,5.4],[5.4,5.92],[5.92,6.18],[6.18,6.32],[6.32,6.8],[6.8,7.06],[7.06,7.3],[7.3,7.56],[8.6,8.9],[8.9,9.16],[9.16,9.66],[9.66,10.04],[10.04,10.14],[10.14,10.48],[10.48,10.78],[10.78,12.34],[12.34,12.38],[12.38,12.58],[12.58,13.42],[13.42,13.74],[13.74,14.2],[14.2,15.48],[15.48,15.98],[15.98,16.16],[16.16,16.52],[16.52,16.55],[16.55,16.68],[16.68,17],[17,17.42],[17.42,17.58],[17.58,18.1],[18.1,18.52],[18.52,18.56],[18.56,18.88],[18.88,19.54],[20.82,21.14],[21.32,21.4],[21.4,21.68],[21.68,22.26],[22.26,22.7],[22.7,23.52],[23.52,23.8],[23.8,24.42],[24.42,24.86],[24.86,25.16],[25.16,25.54],[25.54,26.06],[26.7,27.06],[27.06,27.54],[27.54,27.76],[27.76,27.88],[27.88,28.28],null,[28.72,28.98],[28.98,29.34],[29.34,29.64],[29.64,29.92],[29.92,30.14],[30.14,30.22],[30.22,30.54],[30.54,30.96],[30.96,31.3],[32.46,32.84],[32.84,33.14],[33.14,33.3],[33.3,33.62],[33.96,34.12],[34.12,34.68],[34.68,35.02],[35.02,35.32],[35.32,35.68],[35.68,36.46],[36.46,36.84],[36.84,37.18],[37.18,37.52],[38.5,39.04],[39.04,39.64],[39.84,39.96],[39.96,40.64],[41.02,41.06],[41.06,41.42],[41.42,41.84],[41.84,42.3],[42.3,42.34],[42.34,42.64],[42.64,43.3],[43.3,44],[44,44.22],[44.22,44.84],[45.66,45.9],[45.9,46.08],[46.08,46.38],[46.38,46.54],[46.54,47.04],[47.04,47.44],[47.44,47.64],[47.64,47.98],[48.8,48.98],[48.98,49.36],[49.36,49.4],[49.4,49.74],[49.74,50.22],[50.22,50.66],[50.66,50.98],[50.98,51.46],[51.46,51.8],[51.8,52.06],[52.06,52.3],[52.3,52.68],[53.64,53.98],[53.98,54.2],[54.2,54.9],[54.94,55.12],[55.36,55.44],[55.44,55.96],[55.96,56.14],[56.14,56.54],[56.54,56.86],[56.86,57.16],[57.16,57.42],[57.42,57.58],[57.58,57.94],[57.94,58.5],[58.5,58.94],[58.94,59.38],[59.38,59.76],[59.76,60.04],[60.04,60.56],[61.76,62.28],[62.28,62.46],[62.46,62.7],[62.7,63.14],[63.14,63.66],null,[64.56,64.7],[64.7,65.18],[65.18,65.2],[65.2,65.42],[65.42,66.12],[66.12,66.56],[66.58,67.74],[67.74,67.77],[67.77,68.04],[68.04,68.58],[68.58,69.04],[69.04,69.07],[69.07,69.36],[69.36,69.86],[70.46,70.68],[70.68,70.86],[70.86,71.04],[71.04,71.34],[71.34,71.72],[71.72,72.16],[72.16,72.5],[72.5,72.88],[72.88,73.34],[73.34,73.78],[73.78,73.92],[73.92,74.22],[74.22,74.58],[74.58,74.92],[74.92,75.2],[75.2,75.32],[75.32,75.6],[76.5,76.9],[76.9,77.04],[77.04,77.26],[77.26,77.46],[77.46,77.8],[77.8,78.22],[78.22,78.6],[78.6,80.3],[80.3,80.33],[80.33,80.44],[80.44,81.02],[81.02,81.22],[81.22,81.4],[81.4,81.88],[81.88,82.22],[82.22,82.62],[82.62,82.96],[82.96,83.8],[83.9,84.4],[84.4,84.52],[84.52,84.82],[84.82,85.3],[85.3,85.7],[85.7,86.24],[86.24,86.76],[86.76,87.48],[87.48,87.82],[87.82,88.16],[89.1,89.62],[89.62,89.84],[89.84,90.3],[90.72,90.92],[90.92,91.26],[91.26,91.58],[91.58,91.7],[91.7,91.94],[91.94,92.24],[92.24,92.62],[92.62,93.06],[93.06,94.02],[94.02,95.04],[95.04,95.28],[95.28,95.52],[95.52,96.02],[96.02,96.54],[96.9,96.98],[96.98,97.16],[97.16,97.94],[98.66,99.2],[99.2,99.6],[99.6,100.1],[100.1,100.68],[100.68,100.96],[100.96,101.62],[101.62,102.28],[102.28,102.54],[102.54,102.84],[102.84,103.02],[103.02,103.4],[103.4,104],[104,104.34],[105.48,105.76],[105.76,105.94],[105.94,106.44],[106.44,106.5],[106.5,106.8],[106.8,107.14],[107.14,107.28],[107.28,107.78],[107.78,108.08],[108.08,108.46],[108.46,109],[109,109.04],[109.04,109.36],[109.36,109.74],[109.74,110.06],[110.06,110.28],[110.28,110.56],[110.56,110.96],[110.96,111.4],[111.4,111.64],[111.64,111.78],[111.78,112],[112.92,113.28],[113.28,113.48],[113.48,113.64],[113.64,113.8],[113.8,114.34],[114.34,114.8],[114.8,115.54],[115.92,116.16],[116.16,116.3],[116.3,116.4],[116.4,116.64],[116.64,117.32],[117.52,117.58],[117.58,118.02],[118.02,118.06],[118.06,118.22],[118.22,118.58],[118.58,118.76],[118.76,119.28],[119.88,120.32],[120.32,120.72],[120.72,120.76],[120.76,120.88],[120.88,121.16],[121.16,121.56],[121.56,122.12],[122.12,122.68],[122.68,122.8],[122.8,123.16],[123.16,123.62]]
        },
        "title": "第一列",
        "theme": {
          "zh": "国际贸易博览会",
          "en": "A Day at the International Trade Fair"
        },
        "words": [
          {
            "id": "s1col1-proximity",
            "word": "proximity",
            "pos": "n.",
            "meaning": "接近；邻近"
          },
          {
            "id": "s1col1-barren",
            "word": "barren",
            "pos": "adj.",
            "meaning": "贫瘠的；荒芜的"
          },
          {
            "id": "s1col1-radiate",
            "word": "radiate",
            "pos": "v.",
            "meaning": "辐射；散发"
          },
          {
            "id": "s1col1-craftsmanship",
            "word": "craftsmanship",
            "pos": "n.",
            "meaning": "手艺；工艺"
          },
          {
            "id": "s1col1-testify",
            "word": "testify",
            "pos": "v.",
            "meaning": "作证；证明"
          },
          {
            "id": "s1col1-sentiment",
            "word": "sentiment",
            "pos": "n.",
            "meaning": "情绪；意见"
          },
          {
            "id": "s1col1-intimidate",
            "word": "intimidate",
            "pos": "v.",
            "meaning": "恐吓；威慑"
          },
          {
            "id": "s1col1-supposedly",
            "word": "supposedly",
            "pos": "adv.",
            "meaning": "据称；据说"
          },
          {
            "id": "s1col1-managerial",
            "word": "managerial",
            "pos": "adj.",
            "meaning": "管理的；经理的"
          },
          {
            "id": "s1col1-retailer",
            "word": "retailer",
            "pos": "n.",
            "meaning": "零售商"
          },
          {
            "id": "s1col1-elite",
            "word": "elite",
            "pos": "n.",
            "meaning": "精英；精英阶层"
          },
          {
            "id": "s1col1-deficit",
            "word": "deficit",
            "pos": "n.",
            "meaning": "赤字；逆差"
          },
          {
            "id": "s1col1-supplement",
            "word": "supplement",
            "pos": "n./v.",
            "meaning": "补充物；增补"
          },
          {
            "id": "s1col1-graphic",
            "word": "graphic",
            "pos": "adj.",
            "meaning": "图形的；生动的"
          },
          {
            "id": "s1col1-bilingual",
            "word": "bilingual",
            "pos": "adj.",
            "meaning": "双语的"
          },
          {
            "id": "s1col1-momentum",
            "word": "momentum",
            "pos": "n.",
            "meaning": "动力；势头"
          },
          {
            "id": "s1col1-debris",
            "word": "debris",
            "pos": "n.",
            "meaning": "碎片；残骸"
          },
          {
            "id": "s1col1-deposit",
            "word": "deposit",
            "pos": "n./v.",
            "meaning": "押金；存款"
          },
          {
            "id": "s1col1-expertise",
            "word": "expertise",
            "pos": "n.",
            "meaning": "专长；专业知识"
          },
          {
            "id": "s1col1-coast",
            "word": "coast",
            "pos": "n.",
            "meaning": "海岸"
          },
          {
            "id": "s1col1-memorandum",
            "word": "memorandum",
            "pos": "n.",
            "meaning": "备忘录"
          },
          {
            "id": "s1col1-dietary",
            "word": "dietary",
            "pos": "adj.",
            "meaning": "饮食的"
          },
          {
            "id": "s1col1-exotic",
            "word": "exotic",
            "pos": "adj.",
            "meaning": "异国的；奇异的"
          },
          {
            "id": "s1col1-modify",
            "word": "modify",
            "pos": "v.",
            "meaning": "修改；调整"
          },
          {
            "id": "s1col1-solitude",
            "word": "solitude",
            "pos": "n.",
            "meaning": "独处；孤独"
          },
          {
            "id": "s1col1-isolated",
            "word": "isolated",
            "pos": "adj.",
            "meaning": "孤立的；偏僻的"
          },
          {
            "id": "s1col1-variable",
            "word": "variable",
            "pos": "adj./n.",
            "meaning": "可变的；变量"
          },
          {
            "id": "s1col1-shelter",
            "word": "shelter",
            "pos": "n./v.",
            "meaning": "庇护；避难所"
          },
          {
            "id": "s1col1-subtle",
            "word": "subtle",
            "pos": "adj.",
            "meaning": "微妙的；细微的"
          },
          {
            "id": "s1col1-interpersonal",
            "word": "interpersonal",
            "pos": "adj.",
            "meaning": "人际的"
          },
          {
            "id": "s1col1-intensive",
            "word": "intensive",
            "pos": "adj.",
            "meaning": "密集的；强化的"
          },
          {
            "id": "s1col1-profitable",
            "word": "profitable",
            "pos": "adj.",
            "meaning": "有利可图的"
          },
          {
            "id": "s1col1-pit",
            "word": "pit",
            "pos": "n.",
            "meaning": "坑；深渊"
          },
          {
            "id": "s1col1-convert",
            "word": "convert",
            "pos": "v.",
            "meaning": "转换；改变"
          },
          {
            "id": "s1col1-bind",
            "word": "bind",
            "pos": "v.",
            "meaning": "捆绑；约束"
          },
          {
            "id": "s1col1-scooter",
            "word": "scooter",
            "pos": "n.",
            "meaning": "踏板车；小型摩托车"
          },
          {
            "id": "s1col1-skyscraper",
            "word": "skyscraper",
            "pos": "n.",
            "meaning": "摩天大楼"
          }
        ],
        "paragraphs": [
          {
            "id": "s1col1-p1",
            "segments": [
              "The annual International Trade Fair sprawled along the ",
              {
                "vocabId": "s1col1-coast",
                "text": "coast"
              },
              ", its gleaming pavilions casting reflections that seemed to ",
              {
                "vocabId": "s1col1-radiate",
                "text": "radiate"
              },
              " across the harbor. In close ",
              {
                "vocabId": "s1col1-proximity",
                "text": "proximity"
              },
              " to the city's financial district—where a glass ",
              {
                "vocabId": "s1col1-skyscraper",
                "text": "skyscraper"
              },
              " dominated the skyline—the fairground had turned a once ",
              {
                "vocabId": "s1col1-barren",
                "text": "barren"
              },
              " stretch of shoreline into a bustling marketplace. Elena, a negotiator whose ",
              {
                "vocabId": "s1col1-bilingual",
                "text": "bilingual"
              },
              "\n",
              {
                "vocabId": "s1col1-expertise",
                "text": "expertise"
              },
              " in cross-cultural deals was widely respected, arrived early on her ",
              {
                "vocabId": "s1col1-scooter",
                "text": "scooter"
              },
              ", weaving past the ",
              {
                "vocabId": "s1col1-debris",
                "text": "debris"
              },
              " of the previous night's celebration."
            ],
            "analysis": {
              "translation": "一年一度的国际贸易博览会沿着海岸铺展开来，一座座熠熠生辉的展馆投下的倒影似乎向港口四面八方放射开去。博览会场地紧邻城市的金融区——在那里，一栋玻璃摩天大楼主宰着天际线——它把一段曾经荒芜的海岸线变成了一处熙熙攘攘的集市。埃琳娜是一位谈判代表，她在跨文化交易中展现出的双语专长广受尊敬；她一早便骑着小型踏板车抵达，在昨夜庆典留下的残屑间穿行而过。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “一年一度的国际贸易博览会沿着海岸铺展开来，一座座熠…” → “博览会场地紧邻城市的金融区——在那里，一栋玻璃摩天…” → “埃琳娜是一位谈判代表，她在跨文化交易中展现出的双语…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 The annual International Trade Fair sprawled along the coast,主语是博览会，谓语 sprawled 表示“向四方延伸”。",
                "<span class=\"keyword\">结构拆解</span>：its gleaming pavilions casting reflections... 是<span class=\"keyword\">独立主格结构</span>,由名词 + 现在分词构成，作伴随状语补充说明展馆的状态。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：that seemed to radiate across the harbor 是<span class=\"keyword\">定语从句</span>,修饰 reflections,关系代词 that 在从句中作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：破折号之间的 where a glass skyscraper dominated the skyline 是<span class=\"keyword\">定语从句</span>,修饰 financial district,where 在从句中作地点状语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">in close proximity to</span> 意为“紧邻、在……附近”,介词短语作表语/状语，表示位置关系。",
                "<span class=\"keyword\">结构拆解</span>：a negotiator whose bilingual expertise... was widely respected 是<span class=\"keyword\">定语从句</span>,whose 在从句中作定语修饰 expertise,介绍埃琳娜的背景。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">weaving past the debris</span> 为现在分词短语作伴随状语，表示她骑车的同时穿行于残屑之间，动作与 arrived 同时发生。",
                "<span class=\"keyword\">语境搭配</span>：coast 出现在“along the coast”中，本段取“海岸”义；radiate 出现在“seemed to radiate across the harbor”中，本段取“辐射”义；proximity 出现在“In close proximity to the city's”中，本段取“接近”义；skyscraper 出现在“a glass skyscraper dominated the skyline”中，本段取“摩天大楼”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col1-p2",
            "segments": [
              "Inside the main hall, stalls displayed goods that celebrated ",
              {
                "vocabId": "s1col1-craftsmanship",
                "text": "craftsmanship"
              },
              " from every continent: hand-woven textiles, ",
              {
                "vocabId": "s1col1-exotic",
                "text": "exotic"
              },
              " spices in tidy rows, and a ",
              {
                "vocabId": "s1col1-dietary",
                "text": "dietary"
              },
              "\n",
              {
                "vocabId": "s1col1-supplement",
                "text": "supplement"
              },
              " promising renewed vigor. An ",
              {
                "vocabId": "s1col1-elite",
                "text": "elite"
              },
              " group of importers circled the displays, among them a prominent ",
              {
                "vocabId": "s1col1-retailer",
                "text": "retailer"
              },
              " searching for ",
              {
                "vocabId": "s1col1-profitable",
                "text": "profitable"
              },
              " new lines to stock. For many exhibitors, however, the season's trade ",
              {
                "vocabId": "s1col1-deficit",
                "text": "deficit"
              },
              " had forced them to ",
              {
                "vocabId": "s1col1-supplement",
                "text": "supplement"
              },
              " declining domestic sales with foreign contracts."
            ],
            "analysis": {
              "translation": "在主展厅内，各个摊位陈列着颂扬各大洲工艺水准的商品：手工编织的纺织品、整齐排列的异域香料，以及一种号称能让人恢复精力的膳食补充剂。一群精英进口商在展台间穿梭，其中有一位知名零售商正在寻找有利可图的新货源以供上架。然而，对许多参展商而言，本季的贸易逆差已迫使他们用海外合同来弥补日益下滑的国内销售。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在主展厅内，各个摊位陈列着颂扬各大洲工艺水准的商品…” → “一群精英进口商在展台间穿梭，其中有一位知名零售商正…” → “对许多参展商而言，本季的贸易逆差已迫使他们用海外合…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 stalls displayed goods,后接 that celebrated craftsmanship... <span class=\"keyword\">定语从句</span>修饰 goods,关系代词 that 作从句主语。",
                "<span class=\"keyword\">逻辑衔接</span>：冒号后的 hand-woven textiles, exotic spices... and a dietary supplement 是对 goods 的<span class=\"keyword\">同位语列举</span>,通过具体名词短语解释商品内容。",
                "<span class=\"keyword\">结构拆解</span>：promising renewed vigor 是<span class=\"keyword\">现在分词短语作后置定语</span>,修饰 a dietary supplement,表示“承诺能恢复精力的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：among them a prominent retailer searching for... 是<span class=\"keyword\">独立成分</span>,among them 作状语，searching for... 为现在分词短语作后置定语修饰 retailer。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">to stock</span> 为不定式作目的状语，补充说明寻找新货源的目的在于“上架销售”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">逻辑衔接</span>：however 表转折，连接后半句；the season's trade deficit had forced them to supplement... 中 <span class=\"keyword\">force sb to do sth</span> 是“迫使某人做某事”的结构。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">supplement... with...</span> 意为“用……来补充/弥补……”,declining domestic sales 作 supplement 的宾语，foreign contracts 作 with 的宾语。",
                "<span class=\"keyword\">语境搭配</span>：craftsmanship 出现在“that celebrated craftsmanship from every continent”中，本段取“手艺”义；exotic 出现在“exotic spices in tidy”中，本段取“异国的”义；dietary 出现在“and a dietary supplement promising renewed”中，本段取“饮食的”义；supplement 出现在“a dietary supplement promising renewed vigor”中，本段取“补充物”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col1-p3",
            "segments": [
              "Elena's role was largely ",
              {
                "vocabId": "s1col1-managerial",
                "text": "managerial"
              },
              ". She drafted a ",
              {
                "vocabId": "s1col1-memorandum",
                "text": "memorandum"
              },
              " outlining terms, supervised a substantial ",
              {
                "vocabId": "s1col1-deposit",
                "text": "deposit"
              },
              " on a container shipment, and worked to ",
              {
                "vocabId": "s1col1-convert",
                "text": "convert"
              },
              " cautious interest into signed contracts that would ",
              {
                "vocabId": "s1col1-bind",
                "text": "bind"
              },
              " both parties for the year. As the morning wore on, ",
              {
                "vocabId": "s1col1-momentum",
                "text": "momentum"
              },
              " built steadily. A few exhibitors tried to ",
              {
                "vocabId": "s1col1-intimidate",
                "text": "intimidate"
              },
              " rivals with flashy demonstrations, yet the prevailing ",
              {
                "vocabId": "s1col1-sentiment",
                "text": "sentiment"
              },
              " favored quiet, ",
              {
                "vocabId": "s1col1-interpersonal",
                "text": "interpersonal"
              },
              " trust over spectacle."
            ],
            "analysis": {
              "translation": "埃琳娜的职责主要是管理性的。她起草了一份列明条款的备忘录，监督了一笔集装箱货物的大额押金，并设法把谨慎的兴趣转化为将使双方受一年约束的已签合同。随着上午时光的推移，势头稳步积聚。少数参展商试图用花哨的演示来威慑对手，然而占主导的情绪更青睐安静、人际间的信任，而非喧闹的场面。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “埃琳娜的职责主要是管理性的” → “上午时光的推移，势头稳步积聚” → “少数参展商试图用花哨的演示来威慑对手，然而占主导的…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 She drafted a memorandum, supervised a substantial deposit, and worked to convert...,三个并列谓语共用主语 She,体现她管理工作的多项内容。",
                "<span class=\"keyword\">结构拆解</span>：outlining terms 是<span class=\"keyword\">现在分词短语作后置定语</span>,修饰 memorandum,说明备忘录的内容是“列明条款”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：that would bind both parties for the year 是<span class=\"keyword\">定语从句</span>,修饰 signed contracts,关系代词 that 作从句主语，bind 表示“约束”。",
                "<span class=\"keyword\">结构拆解</span>：As the morning wore on 是<span class=\"keyword\">时间状语从句</span>,as 意为“随着”,wore on 表示时间“慢慢过去”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">convert... into...</span> 意为“把……转化为……”,此处把谨慎的兴趣转化为已签合同。",
                "<span class=\"keyword\">地道表达</span>：tried to intimidate rivals with flashy demonstrations 中 <span class=\"keyword\">intimidate sb with sth</span> 表示“用某物威慑某人”,yet 引出转折。",
                "<span class=\"keyword\">地道表达</span>：favored quiet, interpersonal trust over spectacle 中 <span class=\"keyword\">favor A over B</span> 表示“偏爱 A 胜过 B”,作 prevailing sentiment 的谓语。",
                "<span class=\"keyword\">语境搭配</span>：managerial 出现在“was largely managerial”中，本段取“管理的”义；memorandum 出现在“drafted a memorandum outlining terms”中，本段取“备忘录”义；deposit 出现在“a substantial deposit on a container”中，本段取“押金”义；convert 出现在“worked to convert cautious interest into”中，本段取“转换”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col1-p4",
            "segments": [
              "Throughout the afternoon, Elena observed how the fair could ",
              {
                "vocabId": "s1col1-testify",
                "text": "testify"
              },
              " to globalization's reach—or, as critics ",
              {
                "vocabId": "s1col1-supposedly",
                "text": "supposedly"
              },
              " claimed, to its excesses. ",
              {
                "vocabId": "s1col1-graphic",
                "text": "Graphic"
              },
              " posters advertised how manufacturers ",
              {
                "vocabId": "s1col1-modify",
                "text": "modify"
              },
              " their lines to suit ",
              {
                "vocabId": "s1col1-variable",
                "text": "variable"
              },
              " consumer tastes. In one corner, a noisy ",
              {
                "vocabId": "s1col1-pit",
                "text": "pit"
              },
              " of auctioneers shouted bids beneath a temporary ",
              {
                "vocabId": "s1col1-shelter",
                "text": "shelter"
              },
              " that offered only ",
              {
                "vocabId": "s1col1-subtle",
                "text": "subtle"
              },
              " relief from the sun. She found the pace ",
              {
                "vocabId": "s1col1-intensive",
                "text": "intensive"
              },
              " but exhilarating, and when the crowds thinned, she savored a rare moment of ",
              {
                "vocabId": "s1col1-solitude",
                "text": "solitude"
              },
              "—feeling, for a few minutes, wonderfully ",
              {
                "vocabId": "s1col1-isolated",
                "text": "isolated"
              },
              " from the world's clamor."
            ],
            "analysis": {
              "translation": "整个下午，埃琳娜观察着这场博览会如何印证全球化的触角——或者正如批评者据称所言，印证它的过度。图文海报宣传着制造商如何调整其产品线以迎合多变的消费者口味。在一个角落，一片喧闹的拍卖人群在仅能稍稍遮挡烈日的临时棚架下高声喊价。她觉得节奏紧张却令人兴奋；当人群渐渐稀疏，她享受起难得的片刻独处——有那么几分钟，她美妙地与这世界的喧嚣隔绝开来。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “整个下午，埃琳娜观察着这场博览会如何印证全球化的触…” → “在一个角落，一片喧闹的拍卖人群在仅能稍稍遮挡烈日的…” → “她觉得节奏紧张却令人兴奋” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 Elena observed how the fair could testify to globalization's reach,how 引导<span class=\"keyword\">宾语从句</span>作 observed 的宾语。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后的 or, as critics supposedly claimed, to its excesses 是与 to globalization's reach 并列的介词宾语，as critics supposedly claimed 是评论性插入语，交代这一判断的来源。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：how manufacturers modify their lines to suit variable consumer tastes 是<span class=\"keyword\">宾语从句</span>,作 advertised 的宾语，<span class=\"keyword\">to suit</span> 为不定式作目的状语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：that offered only subtle relief from the sun 是<span class=\"keyword\">定语从句</span>,修饰 a temporary shelter,关系代词 that 作从句主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：feeling, for a few minutes, wonderfully isolated from... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,补充说明她独处时的心境。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">testify to</span> 意为“印证、证明”,后面接全球化影响的对象。",
                "<span class=\"keyword\">结构拆解</span>：When the crowds thinned 是<span class=\"keyword\">时间状语从句</span>,thin 在此处作动词意为“变稀疏”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境搭配</span>：testify 出现在“fair could testify to globalization's reach”中，本段取“作证”义；supposedly 出现在“as critics supposedly claimed”中，本段取“据称”义；Graphic 出现在“Graphic posters advertised how”中，本段取“图形的”义；modify 出现在“how manufacturers modify their lines to”中，本段取“修改”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s1col2",
        "number": 2,
        "audio": {
          "src": "audio/list1_col2.mp3",
          "cues": [[0,0.18],[0.18,0.34],[0.64,0.74],[0.74,1],[1,1.42],[1.42,1.68],[1.68,1.82],[1.82,2.14],[2.14,2.54],[2.54,2.88],[2.88,2.9],[2.9,3.18],[3.18,4.08],null,[4.22,4.34],[4.34,4.58],[4.58,5.08],[5.08,5.5],[5.5,5.96],[5.96,6.12],[6.12,6.36],[7.42,7.58],[7.58,7.8],[7.8,8.38],null,[8.76,9.04],[9.04,9.72],[9.72,9.98],[9.98,10.58],[11.12,11.34],[11.34,11.62],[11.62,12.08],[12.08,12.11],[12.11,12.4],[12.4,12.62],[12.62,12.78],[12.78,13],[13.68,13.74],[13.74,13.88],[13.88,14.06],[14.06,14.54],[14.54,14.88],[14.88,15.12],[15.12,15.36],[15.36,15.76],[15.76,16.12],[16.12,16.38],[16.38,16.64],[16.64,16.94],[18.32,18.44],[18.44,18.66],[18.66,18.82],[18.82,18.96],[18.96,19.36],[19.36,19.41],[19.41,19.54],[19.54,20],[20,20.46],[20.46,20.84],[20.84,21.22],[21.22,21.66],[21.66,21.68],[21.68,21.94],[21.94,22.66],[22.66,22.9],[22.9,23.46],[23.8,23.94],[23.94,24.04],[24.04,24.32],[24.32,24.9],[24.9,25.4],[25.4,25.6],[25.6,25.88],[25.88,26.22],[26.22,26.56],[26.56,26.98],[27.66,27.98],[27.98,28.38],null,[28.38,28.68],[28.68,29.08],[29.08,29.56],[29.56,29.7],[29.7,30.56],[30.56,30.88],[30.88,31.36],[32.64,32.88],[32.88,33.4],[33.4,33.72],[33.72,33.9],[33.9,34.36],[34.36,35.1],[35.7,36.18],[36.18,36.4],[36.4,36.74],[36.74,37.04],[37.04,37.34],[37.34,37.86],[37.86,39.54],[39.54,39.58],[39.58,39.78],[39.78,40.22],[40.22,40.42],[40.42,40.64],[40.64,41.12],[41.12,41.58],[41.58,41.84],[41.84,42.38],[42.38,42.48],[42.48,42.7],[42.7,43.22],[43.86,43.98],[43.98,44.28],[44.28,44.8],[44.8,45.18],[45.18,46.02],[46.02,46.06],[46.06,46.42],[46.42,46.58],[46.58,46.82],[46.82,47.14],[48.2,48.38],[48.38,48.58],[48.58,48.82],[48.82,49.24],[49.24,49.54],[49.54,49.66],[49.66,50.14],[50.14,50.72],[50.72,50.8],[50.8,51.1],[51.1,51.36],[51.36,51.48],[51.48,51.56],[51.56,51.9],[51.9,52.26],[52.26,52.94],[53.34,53.6],[53.6,53.94],[53.94,54.14],[54.14,54.42],[54.42,54.58],[54.58,54.94],[54.94,55.26],[55.26,55.62],[55.62,55.86],[55.86,56.24],[56.24,56.42],[56.42,56.78],[56.98,57.42],[57.42,57.58],[57.58,57.8],[57.8,58.2],[58.2,58.34],[58.34,58.56],[58.56,58.72],[58.72,58.98],[58.98,59.4],null,[60.62,60.82],null,[61.1,61.28],[61.28,61.62],[61.62,61.96],[61.96,62.06],[62.06,62.36],[62.9,63.14],[63.14,63.54],[63.54,63.82],[63.82,64.02],[64.02,64.22],[64.22,64.36],[64.36,64.46],[64.46,64.64],[64.64,64.88],[64.88,65.14],[66.02,66.14],[66.14,66.38],[66.64,66.8],[66.8,67.1],[67.72,67.9],[67.9,68.28],[68.28,68.84],[68.84,69.2],[69.2,69.4],[69.4,69.72],[70.72,70.98],[70.98,71.28],[71.28,71.58],[71.58,72.04],[72.04,72.48],[72.48,72.92],[72.92,73.1],[73.1,73.44],[74.12,74.16],[74.16,74.38],[74.38,74.52],[74.52,74.8],[74.8,75.1],[75.1,75.32],[75.32,75.76],[75.76,76.36],[76.36,76.5],[76.5,76.78],[76.78,77.5],[78.24,78.62],[78.62,79.04],[79.04,79.28],[79.28,79.72],[79.72,80.36],[80.36,80.86],[80.86,81.08],[81.08,81.38],[81.38,81.82],[81.82,82.04],[82.04,82.28],[82.28,82.72],[83.36,83.96],[83.96,84.52],[84.52,84.88],[84.88,85.36],[85.36,85.76],[85.76,85.88],[85.88,87.32],[87.32,87.34],[87.34,87.5],[87.5,88.08],[88.08,88.38],[88.38,88.56],[88.56,89.06],[89.34,89.4],[89.4,89.64],[90.22,90.36],[90.36,90.56],[90.56,90.8],[90.8,91.66],[91.66,91.82],[91.82,92.04],[92.04,92.48],[92.48,93.02],[94.04,94.16],[94.16,94.28],[94.28,94.48],[94.48,94.72],[94.72,94.9],[94.9,95.26],[95.26,95.72],[95.72,96.02],[96.02,96.34],[96.34,96.82],[98.28,98.44],[98.44,98.49],[98.49,98.74],[98.74,99.24],[99.24,99.62],[99.62,99.72],[99.72,100.1],[100.1,100.34],[100.74,100.98],[100.98,101.44],[101.44,101.66],[101.66,101.88],[101.88,102.1],[102.1,102.34],[102.34,103.02],[103.02,103.52],[103.52,103.82],[103.82,104.18],[105.2,105.42],[105.42,105.64],[105.64,105.84],[105.84,106.08],[106.08,106.46],[106.46,106.96],[106.96,107],[107,107.24],[107.24,107.7],[108.3,108.62],[108.62,108.76],[108.76,108.92],[108.92,109.38],[109.38,110.2],[110.2,110.52],[110.52,110.88],[110.88,112.12],[112.12,112.16],[112.16,112.32],[112.32,112.9],[112.9,113.05],[113.05,113.2],[113.2,113.4],[113.4,113.64],[113.64,113.9],[113.9,114.38],[115.44,115.64],[115.64,115.74],[115.74,116.04],[116.04,116.26],[116.26,116.44],[116.44,116.84],[116.84,116.98],[116.98,117.28],[117.76,117.9],[117.9,118.06],[118.06,118.32],[118.32,118.62],[118.62,118.8],[118.8,119.08],[119.08,119.54],[119.86,120.22],[120.22,120.56],[120.56,120.96],[121.38,121.56],[121.56,121.78],[121.78,122.04],[122.04,122.3],[122.3,122.52]]
        },
        "title": "第二列",
        "theme": {
          "zh": "实验室突破",
          "en": "Laboratory Breakthrough"
        },
        "words": [
          {
            "id": "s1col2-alumnus",
            "word": "alumnus",
            "pos": "n.",
            "meaning": "校友"
          },
          {
            "id": "s1col2-tribe",
            "word": "tribe",
            "pos": "n.",
            "meaning": "部落；族"
          },
          {
            "id": "s1col2-irate",
            "word": "irate",
            "pos": "adj.",
            "meaning": "愤怒的"
          },
          {
            "id": "s1col2-algorithm",
            "word": "algorithm",
            "pos": "n.",
            "meaning": "算法"
          },
          {
            "id": "s1col2-parliament",
            "word": "parliament",
            "pos": "n.",
            "meaning": "议会；国会"
          },
          {
            "id": "s1col2-irritated",
            "word": "irritated",
            "pos": "adj.",
            "meaning": "恼怒的；发炎的"
          },
          {
            "id": "s1col2-expansion",
            "word": "expansion",
            "pos": "n.",
            "meaning": "扩张；膨胀"
          },
          {
            "id": "s1col2-autonomy",
            "word": "autonomy",
            "pos": "n.",
            "meaning": "自治；自主权"
          },
          {
            "id": "s1col2-dependent",
            "word": "dependent",
            "pos": "adj.",
            "meaning": "依赖的"
          },
          {
            "id": "s1col2-array",
            "word": "array",
            "pos": "n.",
            "meaning": "一系列；阵列"
          },
          {
            "id": "s1col2-sanctuary",
            "word": "sanctuary",
            "pos": "n.",
            "meaning": "避难所；圣所"
          },
          {
            "id": "s1col2-consensus",
            "word": "consensus",
            "pos": "n.",
            "meaning": "共识；一致"
          },
          {
            "id": "s1col2-census",
            "word": "census",
            "pos": "n.",
            "meaning": "人口普查"
          },
          {
            "id": "s1col2-hypothesis",
            "word": "hypothesis",
            "pos": "n.",
            "meaning": "假设；假说"
          },
          {
            "id": "s1col2-portray",
            "word": "portray",
            "pos": "v.",
            "meaning": "描绘；扮演"
          },
          {
            "id": "s1col2-exceed",
            "word": "exceed",
            "pos": "v.",
            "meaning": "超过；超出"
          },
          {
            "id": "s1col2-herd",
            "word": "herd",
            "pos": "n.",
            "meaning": "兽群；牧群"
          },
          {
            "id": "s1col2-entrepreneur",
            "word": "entrepreneur",
            "pos": "n.",
            "meaning": "企业家"
          },
          {
            "id": "s1col2-rear",
            "word": "rear",
            "pos": "n./v.",
            "meaning": "后部；抚养"
          },
          {
            "id": "s1col2-monarch",
            "word": "monarch",
            "pos": "n.",
            "meaning": "君主"
          },
          {
            "id": "s1col2-payroll",
            "word": "payroll",
            "pos": "n.",
            "meaning": "工资名单；薪金总额"
          },
          {
            "id": "s1col2-quota",
            "word": "quota",
            "pos": "n.",
            "meaning": "配额；定额"
          },
          {
            "id": "s1col2-compensate",
            "word": "compensate",
            "pos": "v.",
            "meaning": "补偿；赔偿"
          },
          {
            "id": "s1col2-bizarre",
            "word": "bizarre",
            "pos": "adj.",
            "meaning": "奇异的；古怪的"
          },
          {
            "id": "s1col2-multiply",
            "word": "multiply",
            "pos": "v.",
            "meaning": "乘；繁殖；增加"
          },
          {
            "id": "s1col2-correlate",
            "word": "correlate",
            "pos": "v.",
            "meaning": "相关；关联"
          },
          {
            "id": "s1col2-foster",
            "word": "foster",
            "pos": "v.",
            "meaning": "培养；促进"
          },
          {
            "id": "s1col2-genetically",
            "word": "genetically",
            "pos": "adv.",
            "meaning": "基因上地"
          },
          {
            "id": "s1col2-mineral",
            "word": "mineral",
            "pos": "n.",
            "meaning": "矿物"
          },
          {
            "id": "s1col2-scheme",
            "word": "scheme",
            "pos": "n./v.",
            "meaning": "计划；图谋"
          },
          {
            "id": "s1col2-simultaneously",
            "word": "simultaneously",
            "pos": "adv.",
            "meaning": "同时地"
          },
          {
            "id": "s1col2-invention",
            "word": "invention",
            "pos": "n.",
            "meaning": "发明"
          },
          {
            "id": "s1col2-dean",
            "word": "dean",
            "pos": "n.",
            "meaning": "院长；教务长"
          },
          {
            "id": "s1col2-supervisor",
            "word": "supervisor",
            "pos": "n.",
            "meaning": "主管；导师"
          },
          {
            "id": "s1col2-deck",
            "word": "deck",
            "pos": "n.",
            "meaning": "甲板；层面"
          }
        ],
        "paragraphs": [
          {
            "id": "s1col2-p1",
            "segments": [
              "When Dr. Owen Hart returned to his alma mater as a distinguished ",
              {
                "vocabId": "s1col2-alumnus",
                "text": "alumnus"
              },
              ", the chemistry laboratory was buzzing with excitement. His former ",
              {
                "vocabId": "s1col2-supervisor",
                "text": "supervisor"
              },
              ", now gray-haired but sharp-eyed, greeted him beside a cluttered ",
              {
                "vocabId": "s1col2-deck",
                "text": "deck"
              },
              " of instruments, while the ",
              {
                "vocabId": "s1col2-dean",
                "text": "dean"
              },
              " herself had cleared her afternoon to witness the demonstration. The team had been running a new ",
              {
                "vocabId": "s1col2-algorithm",
                "text": "algorithm"
              },
              " that processed data from a ",
              {
                "vocabId": "s1col2-genetically",
                "text": "genetically"
              },
              " modified ",
              {
                "vocabId": "s1col2-mineral",
                "text": "mineral"
              },
              " sample, and the preliminary results seemed to validate their central ",
              {
                "vocabId": "s1col2-hypothesis",
                "text": "hypothesis"
              },
              "—an ",
              {
                "vocabId": "s1col2-invention",
                "text": "invention"
              },
              ", they believed, that could revolutionize materials science. Two experiments had run ",
              {
                "vocabId": "s1col2-simultaneously",
                "text": "simultaneously"
              },
              " overnight."
            ],
            "analysis": {
              "translation": "当欧文·哈特博士作为一名杰出校友回到母校时，化学实验室里正洋溢着兴奋的气氛。他昔日的导师如今已满头白发却目光犀利，在一堆杂乱的仪器旁迎接了他；而院长本人也腾出了整个下午来观摩这次演示。团队一直在运行一套新算法，处理来自一块转基因矿物样本的数据，初步结果似乎印证了他们的核心假说——他们相信，这项发明能够彻底革新材料科学。两场实验已同时通宵运行。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当欧文·哈特博士作为一名杰出校友回到母校时，化学实…” → “团队一直在运行一套新算法，处理来自一块转基因矿物样…” → “两场实验已同时通宵运行” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 the chemistry laboratory was buzzing with excitement,When Dr. Owen Hart returned... 是<span class=\"keyword\">时间状语从句</span>,as a distinguished alumnus 作方式/身份状语。",
                "<span class=\"keyword\">逻辑衔接</span>：now gray-haired but sharp-eyed 是<span class=\"keyword\">形容词短语作后置定语</span>,修饰 His former supervisor,but 连接两个并列的形容词成分。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：while the dean herself had cleared her afternoon... 是由 while 引出的对比分句，while 在此表对比，意为“而”。",
                "<span class=\"keyword\">结构拆解</span>：that processed data from a genetically modified mineral sample 是<span class=\"keyword\">定语从句</span>,修饰 a new algorithm,关系代词 that 作从句主语。",
                "<span class=\"keyword\">结构拆解</span>：破折号间的 an invention, they believed, that could revolutionize materials science 是<span class=\"keyword\">同位语</span>,对 central hypothesis 进行解释，其中 that could revolutionize... 是定语从句修饰 invention。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">buzzing with excitement</span> 意为“洋溢着兴奋的气氛”,buzz with 表示“充满……的嗡嗡声/气氛”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">genetically modified</span> 为过去分词短语作定语，修饰 mineral sample,意为“转基因的/基因改造的”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：alumnus 出现在“a distinguished alumnus”中，本段取“校友”义；supervisor 出现在“His former supervisor”中，本段取“主管”义；deck 出现在“a cluttered deck of instruments”中，本段取“甲板”义；dean 出现在“while the dean herself had cleared”中，本段取“院长”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col2-p2",
            "segments": [
              "Yet the atmosphere was not entirely harmonious. A small ",
              {
                "vocabId": "s1col2-tribe",
                "text": "tribe"
              },
              " of junior researchers felt ",
              {
                "vocabId": "s1col2-irritated",
                "text": "irritated"
              },
              " by the relentless pace, and one ",
              {
                "vocabId": "s1col2-irate",
                "text": "irate"
              },
              " technician accused a colleague of cutting corners. The mood grew ",
              {
                "vocabId": "s1col2-bizarre",
                "text": "bizarre"
              },
              " when an ",
              {
                "vocabId": "s1col2-entrepreneur",
                "text": "entrepreneur"
              },
              " who had funded part of the project arrived unannounced, demanding to know whether the lab's ",
              {
                "vocabId": "s1col2-payroll",
                "text": "payroll"
              },
              " could sustain the next quarter and whether the team would meet its promised ",
              {
                "vocabId": "s1col2-quota",
                "text": "quota"
              },
              ". Hart, anxious to ",
              {
                "vocabId": "s1col2-compensate",
                "text": "compensate"
              },
              " for the tension, ushered everyone toward the ",
              {
                "vocabId": "s1col2-rear",
                "text": "rear"
              },
              " of the lab for coffee."
            ],
            "analysis": {
              "translation": "然而，气氛并不完全融洽。一小群初级研究员对无休止的节奏感到恼火，一位愤怒的技术员指责同事偷工减料。当一位曾资助该项目部分资金的企业家不期而至时，气氛变得离奇——他要求知道实验室的工资开支能否撑过下个季度，以及团队能否完成承诺的配额。哈特急于化解这种紧张，把大家引到实验室后方去喝咖啡。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “气氛并不完全融洽” → “当一位曾资助该项目部分资金的企业家不期而至时，气氛…” → “哈特急于化解这种紧张，把大家引到实验室后方去喝咖啡” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句为主系表结构：the atmosphere was not entirely harmonious,yet 放句首表转折。",
                "<span class=\"keyword\">结构拆解</span>：who had funded part of the project 是<span class=\"keyword\">定语从句</span>,修饰 an entrepreneur,关系代词 who 作从句主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：demanding to know... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,表示企业家到达的同时提出要求。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：whether the lab's payroll could sustain the next quarter 和 whether the team would meet its promised quota 是两个并列的<span class=\"keyword\">宾语从句</span>,作 to know 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">cut corners</span> 意为“偷工减料、走捷径”,动词短语，作 accused sb of 的宾语。",
                "<span class=\"keyword\">地道表达</span>：anxious to compensate for the tension 是<span class=\"keyword\">形容词短语作状语</span>,表示哈特当时的心境/动机。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">compensate for</span> 意为“弥补、补偿”,此处指化解紧张气氛。",
                "<span class=\"keyword\">语境搭配</span>：tribe 出现在“A small tribe of junior researchers”中，本段取“部落”义；irritated 出现在“researchers felt irritated by the relentless”中，本段取“恼怒的”义；irate 出现在“and one irate technician accused a”中，本段取“愤怒的”义；bizarre 出现在“mood grew bizarre when an entrepreneur”中，本段取“奇异的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col2-p3",
            "segments": [
              "The breakthrough, he explained, carried implications far beyond the university. ",
              {
                "vocabId": "s1col2-parliament",
                "text": "Parliament"
              },
              " had recently debated regulations on such research, and even the ",
              {
                "vocabId": "s1col2-monarch",
                "text": "monarch"
              },
              " had expressed curiosity about its economic potential. Hart argued that scientific ",
              {
                "vocabId": "s1col2-autonomy",
                "text": "autonomy"
              },
              " must not become ",
              {
                "vocabId": "s1col2-dependent",
                "text": "dependent"
              },
              " on commercial whims; unchecked ",
              {
                "vocabId": "s1col2-expansion",
                "text": "expansion"
              },
              " without ",
              {
                "vocabId": "s1col2-consensus",
                "text": "consensus"
              },
              " could be dangerous. A national ",
              {
                "vocabId": "s1col2-census",
                "text": "census"
              },
              " of research output, he noted, showed that few institutions could ",
              {
                "vocabId": "s1col2-exceed",
                "text": "exceed"
              },
              " international benchmarks, and the data did not ",
              {
                "vocabId": "s1col2-correlate",
                "text": "correlate"
              },
              " funding with genuine innovation."
            ],
            "analysis": {
              "translation": "他解释道，这项突破所蕴含的意义远超这所大学。议会近期已就此类研究的监管展开辩论，甚至连君主也表示对它的经济潜力感到好奇。哈特主张，科学自主权决不能依赖于商业的随意摆布；缺乏共识的无节制扩张可能十分危险。他指出，一份关于科研产出的全国普查显示，鲜有机构能够超越国际基准，而且数据并未把资金与真正的创新关联起来。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他解释道，这项突破所蕴含的意义远超这所大学” → “哈特主张，科学自主权决不能依赖于商业的随意摆布” → “他指出，一份关于科研产出的全国普查显示，鲜有机构能…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 the breakthrough carried implications,he explained 为插入语，far beyond the university 作<span class=\"keyword\">介词短语作状语</span>表程度。",
                "<span class=\"keyword\">语境辨析</span>：Parliament had recently debated regulations on such research 中 debated 是及物动词，regulations 是其宾语；on such research 后置修饰 regulations。",
                "<span class=\"keyword\">结构拆解</span>：that scientific autonomy must not become dependent on commercial whims 是<span class=\"keyword\">宾语从句</span>,作 argued 的宾语，<span class=\"keyword\">become dependent on</span> 表示“变得依赖于”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：unchecked expansion without consensus could be dangerous 是省略 that 的<span class=\"keyword\">宾语从句</span>延续，与上一宾语从句并列。",
                "<span class=\"keyword\">结构拆解</span>：A national census... showed that... 中 that few institutions could exceed international benchmarks 是<span class=\"keyword\">宾语从句</span>作 showed 的宾语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">correlate funding with genuine innovation</span> 意为“把资金与真正的创新关联起来”,correlate A with B 为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：he noted 为插入语，把主句与宾语从句隔开，that the data did not correlate... 是 showed 的第二个并列宾语从句。",
                "<span class=\"keyword\">语境搭配</span>：Parliament 出现在“Parliament had recently debated”中，本段取“议会”义；monarch 出现在“even the monarch had expressed curiosity”中，本段取“君主”义；autonomy 出现在“that scientific autonomy must not become”中，本段取“自治”义；dependent 出现在“not become dependent on commercial whims”中，本段取“依赖的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col2-p4",
            "segments": [
              "In a quiet ",
              {
                "vocabId": "s1col2-sanctuary",
                "text": "sanctuary"
              },
              " at the lab's heart, Hart urged his hosts to ",
              {
                "vocabId": "s1col2-foster",
                "text": "foster"
              },
              " collaboration rather than competition. He wanted to ",
              {
                "vocabId": "s1col2-portray",
                "text": "portray"
              },
              " science as a shared pursuit, one in which discoveries ",
              {
                "vocabId": "s1col2-multiply",
                "text": "multiply"
              },
              " benefit for all—not a ",
              {
                "vocabId": "s1col2-herd",
                "text": "herd"
              },
              " of rivals quick to ",
              {
                "vocabId": "s1col2-scheme",
                "text": "scheme"
              },
              " for advantage. As he surveyed the vast ",
              {
                "vocabId": "s1col2-array",
                "text": "array"
              },
              " of equipment, he felt certain that this small room, modest and cluttered, might yet change the world."
            ],
            "analysis": {
              "translation": "在实验室中心一处安静的静谧之地，哈特恳请东道主们培养协作而非竞争。他希望把科学描绘成一种共同的追求——在其中，发现能成倍地惠及所有人——而不是一群急于为自身利益算计的对手。当他环顾那一大片琳琅满目的设备时，他确信，这间狭小、朴素而杂乱的房间，或许终将改变世界。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在实验室中心一处安静的静谧之地，哈特恳请东道主们培…” → “他希望把科学描绘成一种共同的追求——在其中，发现能…” → “当他环顾那一大片琳琅满目的设备时，他确信，这间狭小…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Hart urged his hosts to foster collaboration rather than competition,<span class=\"keyword\">urge sb to do sth</span> 表示“恳请/敦促某人做某事”。",
                "<span class=\"keyword\">逻辑衔接</span>：rather than competition 是<span class=\"keyword\">rather than</span> 引出的并列成分，与 collaboration 形成对比。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：He wanted to portray science as a shared pursuit 中 <span class=\"keyword\">portray A as B</span> 表示“把 A 描绘成 B”。",
                "<span class=\"keyword\">结构拆解</span>：one in which discoveries multiply benefit for all 是<span class=\"keyword\">同位语 + 定语从句</span>,one 指代 a shared pursuit,in which 引导定语从句。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">逻辑衔接</span>：not a herd of rivals quick to scheme for advantage 与 a shared pursuit 形成并列对照，quick to scheme... 是<span class=\"keyword\">形容词短语作后置定语</span>修饰 rivals。",
                "<span class=\"keyword\">结构拆解</span>：As he surveyed the vast array of equipment 是<span class=\"keyword\">时间状语从句</span>,as 意为“当……时”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：that this small room... might yet change the world 是<span class=\"keyword\">宾语从句</span>作 felt certain 的宾语，modest and cluttered 为形容词短语作 room 的后置定语。",
                "<span class=\"keyword\">语境搭配</span>：sanctuary 出现在“a quiet sanctuary at the lab's”中，本段取“避难所”义；foster 出现在“hosts to foster collaboration rather than”中，本段取“培养”义；portray 出现在“wanted to portray science as a”中，本段取“描绘”义；multiply 出现在“which discoveries multiply benefit for all”中，本段取“乘”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s1col3",
        "number": 3,
        "audio": {
          "src": "audio/list1_col3.mp3",
          "cues": [[0,0.16],[0.16,0.4],[0.4,0.78],[0.78,1.28],[1.28,1.78],[1.78,2.24],[2.24,2.68],[2.68,2.9],[2.9,3.14],[3.14,3.66],[3.66,4],[4.66,4.78],[4.78,5.02],[5.02,5.32],[5.32,5.7],[6.3,6.46],[6.46,6.72],[6.72,7.26],[7.26,7.52],[8.74,8.92],[9.24,9.38],[9.38,9.74],[10.06,10.36],[10.36,10.62],[10.62,10.65],[10.65,10.92],[10.92,11.58],[12.24,12.4],[12.4,12.62],[12.62,12.98],[12.98,13.36],[13.36,13.6],[13.6,14.92],[14.92,15.32],[15.32,15.48],[15.48,15.6],[15.6,15.9],[15.9,16.2],[16.2,16.48],[16.48,16.82],[16.82,17.02],[17.02,17.22],[17.22,17.46],[17.46,17.86],[18.66,19],[19,19.26],[19.26,19.68],[19.68,19.72],[19.72,20],[20,21],null,[21,21.04],[21.04,21.24],[21.24,21.54],[21.54,21.86],[21.86,22.18],[22.18,22.56],[22.56,22.82],[22.82,23.2],[23.8,24.1],[24.1,24.44],[24.44,24.64],[24.64,24.98],[24.98,25.18],[25.18,25.58],[25.58,25.92],[25.92,26.36],[27.14,27.44],[27.44,27.58],[27.58,27.92],[27.92,28.18],[28.18,29.06],[29.06,29.09],[29.09,29.4],[29.4,29.86],[29.86,30.32],[30.32,30.35],[30.35,30.62],[30.62,31.04],[31.04,31.36],[31.36,31.7],[31.7,32.12],[32.12,32.42],[33.22,33.34],[33.34,33.76],[33.76,34],null,[34,34.56],[34.56,34.8],[34.8,35.1],[35.78,35.96],[35.96,36.24],[36.24,36.48],[36.48,36.96],[36.96,37.4],[37.4,37.62],[37.62,37.88],[37.88,38.36],[38.36,38.82],[38.82,38.94],[38.94,39.26],[39.94,40.18],[40.18,40.42],[40.42,40.64],[40.64,41.14],[41.14,41.5],[41.5,41.74],[41.74,41.94],[41.94,42.32],[42.32,42.74],[42.74,42.92],[42.92,43.22],[43.22,43.58],[44.78,44.9],[44.9,45.1],[45.1,45.36],[45.36,45.5],[45.5,45.72],[45.72,46.34],[46.34,46.78],[46.78,46.96],[46.96,47.16],[47.16,47.46],[47.46,47.7],[47.7,47.92],[48.84,48.9],[48.9,49.02],[49.02,49.24],[49.24,49.52],[49.58,49.92],[49.92,50.46],[50.46,50.76],[50.76,51.54],null,[51.54,52.26],[52.26,52.66],[52.66,53],[53,53.16],null,[53.94,54],[54,54.1],[54.1,54.54],[54.54,54.78],[54.78,55.24],[55.24,55.52],[56.42,56.76],[56.76,56.98],[56.98,57.18],[57.18,57.4],[57.4,57.74],[57.74,57.94],[57.94,58.28],[58.28,58.34],[58.34,58.8],[58.8,59],[59,59.28],[59.28,59.66],[60.32,60.5],[60.5,60.8],[61.16,61.42],[61.42,61.76],[61.76,62.1],[62.84,63.14],[63.14,63.44],[63.44,63.66],[63.66,63.84],[63.84,64.08],[64.08,64.36],[64.36,64.56],[64.56,65.08],[65.08,65.58],[66.42,66.56],[66.56,67],[67,67.48],[67.48,68.26],[68.26,68.58],[68.58,68.8],[68.8,69.4],[69.4,69.84],[70.84,71],[71,71.2],[71.2,71.64],[71.64,71.9],[72.66,72.88],[72.88,73.2],[73.2,73.34],[73.34,73.64],null,[74.12,74.26],[74.26,74.5],[74.5,74.72],[74.72,75.2],[75.2,75.26],[75.26,75.48],[75.48,75.72],[75.72,75.84],[75.84,76.1],[76.1,76.64],null,[76.64,77.62],[77.62,77.92],[77.92,78.36],[78.36,78.68],[79.2,79.4],[79.4,79.78],[79.78,80.14],[80.74,80.96],[80.96,81.06],[81.06,81.28],[81.28,81.7],[81.7,82.1],[82.1,82.42],[83.46,83.76],[83.76,84.08],[84.08,84.68],[84.68,84.92],[84.92,85.26],[85.26,85.29],[85.29,85.54],[85.54,86.06],[86.06,86.46],[86.46,86.62],[86.62,87.95],[87.95,88.2],[88.2,88.6],[88.6,88.96],[88.96,89.66],[89.66,89.78],[89.78,90.4],[90.4,90.44],[90.44,90.7],[90.7,91.08],[92.1,92.36],[92.36,92.68],[92.68,92.92],[92.92,93.36],[93.36,93.4],[93.4,93.62],[93.62,94.26],[94.26,94.44],[94.44,94.72],[94.72,95.5],[95.5,96.44],[96.98,97.16],[97.16,97.19],[97.19,97.34],[97.34,97.68],[97.68,98.1],[98.1,98.46],[98.46,99.18],[99.18,99.54],[99.54,100.34],[100.34,100.62],[100.62,100.72],[100.72,100.94],[100.94,101.34],[101.34,102.02],[102.02,102.38],[102.38,102.62],[103.36,103.62],[103.62,103.74],[103.74,103.94],[103.94,104.5],[104.5,104.86],[104.86,105.16],[105.16,105.34],[105.34,105.46],[105.46,105.68],[106.24,106.42],[106.42,106.7],[106.7,106.94],[106.94,107.1],[107.1,107.26],[107.26,107.4],[107.4,108],[108,108.03],[108.03,108.4],[109.24,109.48],[109.48,109.82],[109.82,110.34],[110.34,110.38],[110.38,110.6],[110.6,110.86],[110.86,110.96],[110.96,111.22],[111.22,111.7],[111.7,112.26],[112.26,112.48],[112.48,112.76]]
        },
        "title": "第三列",
        "theme": {
          "zh": "北极探险危机",
          "en": "Arctic Expedition Crisis"
        },
        "words": [
          {
            "id": "s1col3-gross",
            "word": "gross",
            "pos": "adj.",
            "meaning": "总的；严重的"
          },
          {
            "id": "s1col3-owe",
            "word": "owe",
            "pos": "v.",
            "meaning": "欠；归功于"
          },
          {
            "id": "s1col3-trigger",
            "word": "trigger",
            "pos": "v.",
            "meaning": "触发；引发"
          },
          {
            "id": "s1col3-abundant",
            "word": "abundant",
            "pos": "adj.",
            "meaning": "丰富的；充裕的"
          },
          {
            "id": "s1col3-adverse",
            "word": "adverse",
            "pos": "adj.",
            "meaning": "不利的；相反的"
          },
          {
            "id": "s1col3-prolong",
            "word": "prolong",
            "pos": "v.",
            "meaning": "延长；拖延"
          },
          {
            "id": "s1col3-epidemic",
            "word": "epidemic",
            "pos": "n.",
            "meaning": "流行病；传染病"
          },
          {
            "id": "s1col3-prestigious",
            "word": "prestigious",
            "pos": "adj.",
            "meaning": "有声望的"
          },
          {
            "id": "s1col3-predator",
            "word": "predator",
            "pos": "n.",
            "meaning": "捕食者"
          },
          {
            "id": "s1col3-polar",
            "word": "polar",
            "pos": "adj.",
            "meaning": "极地的；两极的"
          },
          {
            "id": "s1col3-antibiotic",
            "word": "antibiotic",
            "pos": "n.",
            "meaning": "抗生素"
          },
          {
            "id": "s1col3-ladder",
            "word": "ladder",
            "pos": "n.",
            "meaning": "梯子"
          },
          {
            "id": "s1col3-stimulus",
            "word": "stimulus",
            "pos": "n.",
            "meaning": "刺激；激励"
          },
          {
            "id": "s1col3-intolerance",
            "word": "intolerance",
            "pos": "n.",
            "meaning": "不宽容；偏执"
          },
          {
            "id": "s1col3-harsh",
            "word": "harsh",
            "pos": "adj.",
            "meaning": "严酷的；刺耳的"
          },
          {
            "id": "s1col3-dismiss",
            "word": "dismiss",
            "pos": "v.",
            "meaning": "驳回；不予理会"
          },
          {
            "id": "s1col3-accustomed",
            "word": "accustomed",
            "pos": "adj.",
            "meaning": "习惯的"
          },
          {
            "id": "s1col3-interpretation",
            "word": "interpretation",
            "pos": "n.",
            "meaning": "解释；诠释"
          },
          {
            "id": "s1col3-exert",
            "word": "exert",
            "pos": "v.",
            "meaning": "施加；努力"
          },
          {
            "id": "s1col3-devise",
            "word": "devise",
            "pos": "v.",
            "meaning": "设计；发明"
          },
          {
            "id": "s1col3-subsidy",
            "word": "subsidy",
            "pos": "n.",
            "meaning": "补贴；津贴"
          },
          {
            "id": "s1col3-cater",
            "word": "cater",
            "pos": "v.",
            "meaning": "迎合；提供饮食"
          },
          {
            "id": "s1col3-surgeon",
            "word": "surgeon",
            "pos": "n.",
            "meaning": "外科医生"
          },
          {
            "id": "s1col3-resilience",
            "word": "resilience",
            "pos": "n.",
            "meaning": "韧性；恢复力"
          },
          {
            "id": "s1col3-resurrection",
            "word": "resurrection",
            "pos": "n.",
            "meaning": "复活；复兴"
          },
          {
            "id": "s1col3-tenant",
            "word": "tenant",
            "pos": "n.",
            "meaning": "租户；佃户"
          },
          {
            "id": "s1col3-dropout",
            "word": "dropout",
            "pos": "n.",
            "meaning": "辍学者"
          },
          {
            "id": "s1col3-lever",
            "word": "lever",
            "pos": "n.",
            "meaning": "杠杆"
          },
          {
            "id": "s1col3-outsource",
            "word": "outsource",
            "pos": "v.",
            "meaning": "外包"
          },
          {
            "id": "s1col3-scenario",
            "word": "scenario",
            "pos": "n.",
            "meaning": "设想；情景"
          },
          {
            "id": "s1col3-deteriorate",
            "word": "deteriorate",
            "pos": "v.",
            "meaning": "恶化"
          },
          {
            "id": "s1col3-depleted",
            "word": "depleted",
            "pos": "adj.",
            "meaning": "耗尽的；枯竭的"
          }
        ],
        "paragraphs": [
          {
            "id": "s1col3-p1",
            "segments": [
              "The ",
              {
                "vocabId": "s1col3-polar",
                "text": "polar"
              },
              " research station stood defiant against the ",
              {
                "vocabId": "s1col3-harsh",
                "text": "harsh"
              },
              " Arctic wind, where ice was ",
              {
                "vocabId": "s1col3-abundant",
                "text": "abundant"
              },
              " but mercy was scarce. Dr. Lena Voss, leader of a ",
              {
                "vocabId": "s1col3-prestigious",
                "text": "prestigious"
              },
              " expedition, had grown ",
              {
                "vocabId": "s1col3-accustomed",
                "text": "accustomed"
              },
              " to ",
              {
                "vocabId": "s1col3-adverse",
                "text": "adverse"
              },
              " conditions—yet nothing in her training had prepared her for what came next."
            ],
            "analysis": {
              "translation": "极地考察站傲然矗立，抵御着凛冽的北极寒风；在这里，冰雪丰沛，而仁慈却极度稀缺。莉娜·沃斯博士是一支备受推崇的考察队的队长，她早已习惯了恶劣的环境——然而她所受的一切训练都未能让她为接下来发生的事做好准备。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “极地考察站傲然矗立，抵御着凛冽的北极寒风” → “莉娜·沃斯博士是一支备受推崇的考察队的队长，她早已…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The polar research station stood defiant against the harsh Arctic wind,<span class=\"keyword\">stand defiant against</span> 表示“傲然抵御/对抗”。",
                "<span class=\"keyword\">结构拆解</span>：where ice was abundant but mercy was scarce 是<span class=\"keyword\">定语从句</span>,修饰前文整个情境(where 表地点),but 连接两个并列分句形成对比。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：leader of a prestigious expedition 是<span class=\"keyword\">同位语</span>,对 Dr. Lena Voss 进行身份补充说明。",
                "<span class=\"keyword\">地道表达</span>：had grown accustomed to adverse conditions 中 <span class=\"keyword\">grow accustomed to</span> 表示“逐渐习惯于”,to 为介词后接名词。",
                "<span class=\"keyword\">地道表达</span>：破折号后 yet nothing in her training had prepared her for what came next 表转折，<span class=\"keyword\">prepare sb for sth</span> 表示“使某人为……做好准备”。",
                "<span class=\"keyword\">结构拆解</span>：what came next 是<span class=\"keyword\">宾语从句</span>,作介词 for 的宾语，what 在从句中作主语，意为“接下来发生的事”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：polar 出现在“The polar research station stood”中，本段取“极地的”义；harsh 出现在“against the harsh Arctic wind”中，本段取“严酷的”义；abundant 出现在“ice was abundant but mercy was”中，本段取“丰富的”义；prestigious 出现在“of a prestigious expedition”中，本段取“有声望的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col3-p2",
            "segments": [
              "It began when a starving ",
              {
                "vocabId": "s1col3-predator",
                "text": "predator"
              },
              ", a polar bear driven inland by melting floes, seemed ready to ",
              {
                "vocabId": "s1col3-trigger",
                "text": "trigger"
              },
              " the camp's perimeter alarm. In the chaos that followed, a technician fell from a maintenance ",
              {
                "vocabId": "s1col3-ladder",
                "text": "ladder"
              },
              " and fractured his leg. The team's ",
              {
                "vocabId": "s1col3-surgeon",
                "text": "surgeon"
              },
              ", working by flashlight, cleaned the wound and administered the last ",
              {
                "vocabId": "s1col3-antibiotic",
                "text": "antibiotic"
              },
              " in their stores, fearing that any infection could spark an ",
              {
                "vocabId": "s1col3-epidemic",
                "text": "epidemic"
              },
              " in such close quarters. The crew had to ",
              {
                "vocabId": "s1col3-exert",
                "text": "exert"
              },
              " themselves hauling the injured man to shelter."
            ],
            "analysis": {
              "translation": "事情起因于一头饥饿的猛兽——一头因浮冰融化而被驱入内陆的北极熊——它似乎要触发营地的周界警报。随之而来的混乱中，一名技术员从维修梯上摔下并摔断了腿。团队的外科医生借着手电筒的光清洗伤口，并注射了他们库存中最后一点抗生素，他担心在这样的狭小空间里任何感染都可能引发一场疫病。全体队员不得不拼尽全力把伤员拖到避风处。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “事情起因于一头饥饿的猛兽——一头因浮冰融化而被驱入…” → “团队的外科医生借着手电筒的光清洗伤口，并注射了他们…” → “全体队员不得不拼尽全力把伤员拖到避风处” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 It began,后接 when 引导的<span class=\"keyword\">时间状语从句</span> a starving predator... seemed ready to trigger the camp's perimeter alarm。",
                "<span class=\"keyword\">结构拆解</span>：a polar bear driven inland by melting floes 是<span class=\"keyword\">同位语</span>,对 a starving predator 进行解释，其中 driven inland by... 为过去分词短语作后置定语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：In the chaos that followed 中 that followed 是<span class=\"keyword\">定语从句</span>修饰 chaos,关系代词 that 作从句主语。",
                "<span class=\"keyword\">结构拆解</span>：working by flashlight 是<span class=\"keyword\">现在分词短语作伴随状语</span>,表示医生在清洗伤口时借助手电筒。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：fearing that any infection could spark an epidemic... 是<span class=\"keyword\">现在分词短语作原因/伴随状语</span>,其中 that 引导宾语从句作 fearing 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">in such close quarters</span> 意为“在如此狭小的空间里”,介词短语作状语。",
                "<span class=\"keyword\">结构拆解</span>：The crew had to exert themselves hauling... 中 <span class=\"keyword\">exert oneself doing sth</span> 表示“竭尽全力做某事”,hauling 为现在分词表伴随。",
                "<span class=\"keyword\">语境搭配</span>：predator 出现在“a starving predator”中，本段取“捕食者”义；trigger 出现在“ready to trigger the camp's perimeter”中，本段取“触发”义；ladder 出现在“a maintenance ladder and fractured his”中，本段取“梯子”义；surgeon 出现在“The team's surgeon”中，本段取“外科医生”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col3-p3",
            "segments": [
              "By the third day, conditions began to ",
              {
                "vocabId": "s1col3-deteriorate",
                "text": "deteriorate"
              },
              ". Food supplies were ",
              {
                "vocabId": "s1col3-depleted",
                "text": "depleted"
              },
              ", and the radio's batteries were dying. Lena knew the sponsor would ",
              {
                "vocabId": "s1col3-owe",
                "text": "owe"
              },
              " them a resupply that never came; back home, through ",
              {
                "vocabId": "s1col3-gross",
                "text": "gross"
              },
              " negligence, officials were quick to ",
              {
                "vocabId": "s1col3-dismiss",
                "text": "dismiss"
              },
              " the crisis as exaggerated, their bureaucratic ",
              {
                "vocabId": "s1col3-intolerance",
                "text": "intolerance"
              },
              " threatening to ",
              {
                "vocabId": "s1col3-prolong",
                "text": "prolong"
              },
              " every decision. She refused to panic."
            ],
            "analysis": {
              "translation": "到了第三天，状况开始恶化。食物补给耗尽，无线电的电池也濒临耗尽。莉娜知道赞助方本该给他们送来一直未到的补给；而在后方，由于严重失职，官员们却急于把这场危机斥为言过其实，他们那种官僚式的偏执威胁着要拖延每一项决策。她拒绝恐慌。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “到了第三天，状况开始恶化” → “莉娜知道赞助方本该给他们送来一直未到的补给” → “她拒绝恐慌” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句为主系表结构：conditions began to deteriorate,<span class=\"keyword\">deteriorate</span> 意为“恶化”,与 began 构成 begin to do 结构。",
                "<span class=\"keyword\">逻辑衔接</span>：Food supplies were depleted, and the radio's batteries were dying 是由 and 连接的<span class=\"keyword\">并列分句</span>,两句均用进行时/被动语态描述状况。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：the sponsor would owe them a resupply that never came 中 that never came 是<span class=\"keyword\">定语从句</span>修饰 resupply,关系代词 that 作从句主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：back home, through gross negligence 是<span class=\"keyword\">介词短语作原因状语</span>,through 在此表示“由于、因为”。",
                "<span class=\"keyword\">地道表达</span>：officials were quick to dismiss the crisis as exaggerated 中 <span class=\"keyword\">be quick to do sth</span> 表示“急于做某事”,<span class=\"keyword\">dismiss... as...</span> 表示“把……斥为……”。",
                "<span class=\"keyword\">结构拆解</span>：their bureaucratic intolerance threatening to prolong every decision 是<span class=\"keyword\">独立主格结构</span>,名词 + 现在分词，作伴随状语补充说明。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：deteriorate 出现在“began to deteriorate”中，本段取“恶化”义；depleted 出现在“supplies were depleted”中，本段取“耗尽的”义；owe 出现在“sponsor would owe them a resupply”中，本段取“欠”义；gross 出现在“through gross negligence”中，本段取“总的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col3-p4",
            "segments": [
              "Drawing on her ",
              {
                "vocabId": "s1col3-resilience",
                "text": "resilience"
              },
              ", she began to ",
              {
                "vocabId": "s1col3-devise",
                "text": "devise"
              },
              " a plan for the worst ",
              {
                "vocabId": "s1col3-scenario",
                "text": "scenario"
              },
              ": to ration what remained, to ",
              {
                "vocabId": "s1col3-outsource",
                "text": "outsource"
              },
              " nothing, and to ",
              {
                "vocabId": "s1col3-cater",
                "text": "cater"
              },
              " only to survival. Then word crackled through that a government ",
              {
                "vocabId": "s1col3-subsidy",
                "text": "subsidy"
              },
              " had been approved—a ",
              {
                "vocabId": "s1col3-lever",
                "text": "lever"
              },
              " and ",
              {
                "vocabId": "s1col3-stimulus",
                "text": "stimulus"
              },
              " that would fund a rescue flight. Among her crew was a former ",
              {
                "vocabId": "s1col3-dropout",
                "text": "dropout"
              },
              " who proved unexpectedly resourceful, and a ",
              {
                "vocabId": "s1col3-tenant",
                "text": "tenant"
              },
              " farmer turned mechanic whose practical ",
              {
                "vocabId": "s1col3-interpretation",
                "text": "interpretation"
              },
              " of the broken engine saved them all. When the rescue helicopter lifted them from the ice, Lena felt as though she were witnessing a ",
              {
                "vocabId": "s1col3-resurrection",
                "text": "resurrection"
              },
              "—life returning to a place that had seemed determined to claim them."
            ],
            "analysis": {
              "translation": "凭借自身的韧性，她开始为最坏的情形制定计划：定量配给剩余物资，凡事亲力亲为，只以满足生存为念。随后传来断断续续的消息：一笔政府补贴已获批准——它既是一根杠杆，也是一种刺激，将为一架救援航班提供资金。她的队员中有一名曾经的辍学者，出人意料地足智多谋；还有一名由佃农转行的机械师，他对那台破损发动机的务实解读拯救了所有人。当救援直升机把他们从冰面上吊起时，莉娜觉得自己仿佛在目睹一场复活——生命重返一个似乎铁了心要索取他们性命的地方。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “凭借自身的韧性，她开始为最坏的情形制定计划：定量配…” → “她的队员中有一名曾经的辍学者，出人意料地足智多谋” → “当救援直升机把他们从冰面上吊起时，莉娜觉得自己仿佛…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：Drawing on her resilience 是<span class=\"keyword\">现在分词短语作方式/原因状语</span>,<span class=\"keyword\">draw on</span> 意为“凭借、动用”。",
                "<span class=\"keyword\">逻辑衔接</span>：to devise a plan for the worst scenario 是<span class=\"keyword\">不定式作目的状语</span>,冒号后的 to ration..., to outsource nothing, and to cater... 是三个并列不定式，作 plan 的同位/解释。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">cater only to survival</span> 意为“只顾及生存”,cater to 表示“迎合、顾及”。",
                "<span class=\"keyword\">结构拆解</span>：that a government subsidy had been approved 是<span class=\"keyword\">同位语从句</span>,作 word 的同位语，解释消息的内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：a lever and stimulus that would fund a rescue flight 中 that would fund... 是<span class=\"keyword\">定语从句</span>修饰 lever and stimulus。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：a former dropout who proved unexpectedly resourceful 中 who proved... 是<span class=\"keyword\">定语从句</span>修饰 dropout,<span class=\"keyword\">resourceful</span> 意为“足智多谋的”。",
                "<span class=\"keyword\">结构拆解</span>：whose practical interpretation... saved them all 是<span class=\"keyword\">定语从句</span>修饰 mechanic,whose 作 interpretation 的定语。",
                "<span class=\"keyword\">结构拆解</span>：When the rescue helicopter lifted them from the ice 是<span class=\"keyword\">时间状语从句</span>,as though she were witnessing a resurrection 是<span class=\"keyword\">方式状语从句</span>,用了虚拟语气 were。这里不是在补充事实，而是用类比或假设呈现人物感受，让画面和语气更鲜明。",
                "<span class=\"keyword\">语境搭配</span>：resilience 出现在“on her resilience”中，本段取“韧性”义；devise 出现在“began to devise a plan for”中，本段取“设计”义；scenario 出现在“the worst scenario”中，本段取“设想”义；outsource 出现在“to outsource nothing”中，本段取“外包”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s1col4",
        "number": 4,
        "audio": {
          "src": "audio/list1_col4.mp3",
          "cues": [[2.04,2.12],[2.12,2.38],[2.38,2.58],[2.58,3.06],[3.06,3.38],[3.38,3.58],[3.58,3.8],[3.8,4.1],null,[4.98,5.06],[5.06,5.38],[5.38,5.76],[5.76,6.08],[6.08,6.34],[6.34,6.64],[6.64,6.88],[6.88,7.16],[7.16,7.4],[7.4,8.02],[8.02,8.54],[8.54,8.96],[8.96,9.34],[9.34,9.8],null,[10.62,10.8],[10.8,11.08],[11.08,11.38],[11.38,11.58],[11.58,11.94],[11.94,11.98],[11.98,12.18],[12.18,12.68],[13.24,13.48],[13.48,14.2],[14.88,14.98],[14.98,15.18],[15.18,15.58],[15.58,16.22],[16.22,16.46],[16.46,16.84],[17.38,17.56],[17.56,17.68],[17.68,18.04],[18.04,18.74],[18.74,19.2],[19.2,19.74],[19.74,20.2],[21.08,21.32],[21.32,21.74],[21.74,22.3],[22.3,22.66],[22.66,22.98],[22.98,23.22],[23.22,23.44],[23.44,23.92],[23.92,23.95],[23.95,24.22],[24.22,24.82],null,[24.82,25.56],[25.56,25.74],[25.74,26.44],[26.44,26.72],[26.72,26.96],[26.96,27.34],[27.34,27.7],[28.72,28.84],[28.84,29.12],[29.12,29.56],[29.56,29.88],[29.88,30.34],[31.34,31.44],[31.44,31.78],[31.78,32.12],[32.12,32.32],[32.32,32.76],[32.76,33.22],[33.22,33.34],[33.34,33.52],[33.52,33.88],[34.42,34.86],[34.86,35.18],[35.18,35.4],[35.4,35.66],[35.66,36.32],[36.32,36.5],[36.5,36.82],[37.62,37.7],[37.7,37.86],[37.86,38.08],[38.08,38.3],[38.3,38.54],[38.54,38.9],[38.9,39.6],[39.6,39.9],[39.9,40.04],[40.04,40.22],[40.22,40.68],[41.38,42.02],[42.02,42.2],[42.2,42.32],[42.32,42.52],[42.52,43.02],[43.02,43.6],[43.6,44.22],[44.22,44.48],[44.48,44.7],[44.7,45.14],[45.14,45.58],[45.58,45.88],[45.88,46.14],[46.76,46.94],[46.94,47.3],[47.3,47.7],[47.7,48.14],[48.14,48.5],[48.5,49.26],[49.26,49.54],[49.54,49.82],[49.82,50.02],[50.02,50.24],[51.14,51.26],[51.26,51.5],[51.5,51.9],[51.9,52.18],[52.18,52.5],[53.86,53.98],[53.98,54.64],[54.64,54.67],[54.67,54.76],[54.76,55.08],[55.52,55.62],[55.62,55.8],[55.8,56.22],[56.22,56.7],[56.7,56.98],[56.98,57.24],[57.24,57.6],[57.6,57.88],[57.88,58.22],[58.22,58.72],[58.72,59.08],[59.08,59.4],[59.4,59.64],[59.64,60.04],[60.64,60.84],[60.84,61.1],[61.1,61.38],[61.38,61.76],[61.76,62.1],[62.1,62.38],[62.38,62.72],[62.72,62.9],[63.94,64.1],[64.1,64.48],[64.48,64.86],[64.86,65.4],[65.4,65.86],[65.86,66.06],[66.06,66.38],[66.38,66.76],[67.3,67.7],[67.7,68],[68,68.36],[68.36,68.66],[68.66,68.94],[68.94,69.16],[69.16,69.3],[69.3,69.64],[69.64,70.02],[70.02,70.26],[70.26,70.48],[70.48,70.84],[70.84,71.4],[71.4,71.68],[71.68,72.24],[73,73.28],[73.28,73.52],[73.52,74.04],[74.04,74.52],[74.52,74.84],[74.84,75.04],[75.74,75.92],[75.92,76.12],[76.12,76.46],[76.46,76.76],[76.76,77.06],[77.06,77.24],[77.24,77.84],[77.84,78.24],[78.24,78.34],[78.34,78.56],[78.56,79.02],[79.02,79.38],[79.38,80],[80,80.54],[80.54,80.84],[80.84,81.58],[81.58,81.78],[81.78,82.06],[82.06,82.32],[82.32,82.52],[82.52,82.78],[83.6,83.66],[83.66,84.08],[84.08,84.11],[84.11,84.42],[84.42,84.82],[84.82,85.1],[85.1,85.44],[85.44,85.6],[85.6,85.72],[85.72,86.08],[86.08,86.26],[86.92,87.16],[87.16,87.44],[87.44,87.84],[88.56,88.76],[88.76,88.96],[88.96,89.4],[89.4,89.58],[89.58,89.84],[89.84,90.06],[91.04,91.44],[91.44,91.82],[91.82,92.18],[92.18,92.7],[92.7,92.84],[92.84,93.26],[93.26,93.6],[93.6,93.9],[93.9,94.02],[94.02,94.36],[95.14,95.38],[95.38,95.78],[95.78,95.82],[95.82,96.06],[96.06,96.66],[96.66,96.92],[96.92,97.32],[97.32,97.36],[97.36,97.62],[97.62,97.84],[97.84,98.02],[98.02,98.64],[98.64,98.66],[98.66,98.84],[98.84,99.42],[100.18,100.38],[100.38,100.46],[100.46,100.7],[100.98,101.04],[101.04,101.34],[101.34,101.54],[101.54,102.16],[102.82,103.1],[103.1,103.34],[103.34,103.62],[103.62,104.02],[104.02,104.07],[104.07,104.22],[104.22,104.38],[104.38,104.62],[104.62,105.04],[105.04,105.08],[105.08,105.34],[105.34,105.66],[105.66,106.18],[106.18,106.36],[106.36,106.6],[106.6,107.54],[107.54,107.88],[107.88,108],[108,108.26],[108.26,108.54],[108.54,108.58],[108.58,108.86],[108.86,109.18],[109.18,109.28],[109.28,109.54],[109.54,109.92],[109.92,110.32],[110.32,110.72],[110.72,111.1]]
        },
        "title": "第四列",
        "theme": {
          "zh": "王国新政",
          "en": "Kingdom's New Policy"
        },
        "words": [
          {
            "id": "s1col4-agenda",
            "word": "agenda",
            "pos": "n.",
            "meaning": "议程；事项"
          },
          {
            "id": "s1col4-tactic",
            "word": "tactic",
            "pos": "n.",
            "meaning": "战术；策略"
          },
          {
            "id": "s1col4-threshold",
            "word": "threshold",
            "pos": "n.",
            "meaning": "门槛；界限"
          },
          {
            "id": "s1col4-substitute",
            "word": "substitute",
            "pos": "n./v.",
            "meaning": "替代品；替代"
          },
          {
            "id": "s1col4-prospective",
            "word": "prospective",
            "pos": "adj.",
            "meaning": "预期的；潜在的"
          },
          {
            "id": "s1col4-livestock",
            "word": "livestock",
            "pos": "n.",
            "meaning": "牲畜"
          },
          {
            "id": "s1col4-aspirin",
            "word": "aspirin",
            "pos": "n.",
            "meaning": "阿司匹林"
          },
          {
            "id": "s1col4-signify",
            "word": "signify",
            "pos": "v.",
            "meaning": "表示；意味着"
          },
          {
            "id": "s1col4-fiscal",
            "word": "fiscal",
            "pos": "adj.",
            "meaning": "财政的"
          },
          {
            "id": "s1col4-fixture",
            "word": "fixture",
            "pos": "n.",
            "meaning": "固定物；常驻事物"
          },
          {
            "id": "s1col4-deterioration",
            "word": "deterioration",
            "pos": "n.",
            "meaning": "恶化；退化"
          },
          {
            "id": "s1col4-degradation",
            "word": "degradation",
            "pos": "n.",
            "meaning": "退化；降级"
          },
          {
            "id": "s1col4-recreation",
            "word": "recreation",
            "pos": "n.",
            "meaning": "娱乐；消遣"
          },
          {
            "id": "s1col4-depict",
            "word": "depict",
            "pos": "v.",
            "meaning": "描绘"
          },
          {
            "id": "s1col4-affluent",
            "word": "affluent",
            "pos": "adj.",
            "meaning": "富裕的"
          },
          {
            "id": "s1col4-testimony",
            "word": "testimony",
            "pos": "n.",
            "meaning": "证词；证据"
          },
          {
            "id": "s1col4-exceptional",
            "word": "exceptional",
            "pos": "adj.",
            "meaning": "杰出的；异常的"
          },
          {
            "id": "s1col4-ideology",
            "word": "ideology",
            "pos": "n.",
            "meaning": "意识形态"
          },
          {
            "id": "s1col4-profile",
            "word": "profile",
            "pos": "n.",
            "meaning": "形象；侧面"
          },
          {
            "id": "s1col4-indulge",
            "word": "indulge",
            "pos": "v.",
            "meaning": "纵容；沉溺"
          },
          {
            "id": "s1col4-bias",
            "word": "bias",
            "pos": "n.",
            "meaning": "偏见；偏心"
          },
          {
            "id": "s1col4-indispensable",
            "word": "indispensable",
            "pos": "adj.",
            "meaning": "不可或缺的"
          },
          {
            "id": "s1col4-steep",
            "word": "steep",
            "pos": "adj.",
            "meaning": "陡峭的；急剧的"
          },
          {
            "id": "s1col4-acre",
            "word": "acre",
            "pos": "n.",
            "meaning": "英亩"
          },
          {
            "id": "s1col4-confine",
            "word": "confine",
            "pos": "v.",
            "meaning": "限制；禁闭"
          },
          {
            "id": "s1col4-slash",
            "word": "slash",
            "pos": "v.",
            "meaning": "大幅削减；砍"
          },
          {
            "id": "s1col4-intimate",
            "word": "intimate",
            "pos": "adj.",
            "meaning": "亲密的；私下的"
          }
        ],
        "paragraphs": [
          {
            "id": "s1col4-p1",
            "segments": [
              "The kingdom of Valdoria had long been ",
              {
                "vocabId": "s1col4-affluent",
                "text": "affluent"
              },
              ", its rolling fields of grain and herds of ",
              {
                "vocabId": "s1col4-livestock",
                "text": "livestock"
              },
              " stretching across every fertile ",
              {
                "vocabId": "s1col4-acre",
                "text": "acre"
              },
              ". Yet recent years had brought a ",
              {
                "vocabId": "s1col4-steep",
                "text": "steep"
              },
              " decline: ",
              {
                "vocabId": "s1col4-fiscal",
                "text": "fiscal"
              },
              " mismanagement, the slow ",
              {
                "vocabId": "s1col4-deterioration",
                "text": "deterioration"
              },
              " of public trust, and the environmental ",
              {
                "vocabId": "s1col4-degradation",
                "text": "degradation"
              },
              " of once-rich farmland. Queen Maris understood that the realm had crossed a dangerous ",
              {
                "vocabId": "s1col4-threshold",
                "text": "threshold"
              },
              ", and that half-measures would no longer suffice."
            ],
            "analysis": {
              "translation": "瓦尔多利亚王国长期以来一直富庶，起伏的麦田与成群的牲畜遍布每一英亩沃土。然而近年却出现了急剧衰落：财政管理失当、公众信任的缓慢瓦解，以及曾经肥沃农田的环境退化。玛丽斯女王明白，这个王国已越过一道危险的门槛，半吊子的措施将不再奏效。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “瓦尔多利亚王国长期以来一直富庶，起伏的麦田与成群的…” → “近年却出现了急剧衰落：财政管理失当、公众信任的缓慢…” → “玛丽斯女王明白，这个王国已越过一道危险的门槛，半吊…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The kingdom of Valdoria had long been affluent,its rolling fields... stretching across every fertile acre 是<span class=\"keyword\">独立主格结构</span>,名词 + 现在分词，作伴随状语补充说明富庶景象。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后 Yet recent years had brought a steep decline 表转折，冒号后 fiscal mismanagement, the slow deterioration..., and the environmental degradation... 是<span class=\"keyword\">并列名词短语作同位语</span>,列举衰落的表现。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：of once-rich farmland 是介词短语作后置定语，修饰 environmental degradation。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：Queen Maris understood that... 中 that the realm had crossed a dangerous threshold 是<span class=\"keyword\">宾语从句</span>作 understood 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：and that half-measures would no longer suffice 是与上一宾语从句并列的第二个<span class=\"keyword\">宾语从句</span>,由 and 连接，that 不可省略。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">cross a threshold</span> 意为“越过门槛/临界点”,<span class=\"keyword\">half-measures</span> 意为“半吊子措施、权宜之计”。",
                "<span class=\"keyword\">语境搭配</span>：affluent 出现在“long been affluent”中，本段取“富裕的”义；livestock 出现在“herds of livestock stretching across every”中，本段取“牲畜”义；acre 出现在“every fertile acre”中，本段取“英亩”义；steep 出现在“brought a steep decline”中，本段取“陡峭的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col4-p2",
            "segments": [
              "Her reform ",
              {
                "vocabId": "s1col4-agenda",
                "text": "agenda"
              },
              " was ambitious. She rejected the rigid ",
              {
                "vocabId": "s1col4-ideology",
                "text": "ideology"
              },
              " of the old court, refusing to let ",
              {
                "vocabId": "s1col4-bias",
                "text": "bias"
              },
              "\n",
              {
                "vocabId": "s1col4-confine",
                "text": "confine"
              },
              " her choices, and she moved to ",
              {
                "vocabId": "s1col4-slash",
                "text": "slash"
              },
              " wasteful spending from the royal budget. Advisors she had once considered ",
              {
                "vocabId": "s1col4-indispensable",
                "text": "indispensable"
              },
              " warned that such sweeping change was reckless, but Maris believed only ",
              {
                "vocabId": "s1col4-exceptional",
                "text": "exceptional"
              },
              " leadership could save the kingdom. Her chief ",
              {
                "vocabId": "s1col4-tactic",
                "text": "tactic"
              },
              " was transparency."
            ],
            "analysis": {
              "translation": "她的改革议程雄心勃勃。她摒弃了旧朝廷僵化的意识形态，拒绝让偏见束缚自己的选择，并着手从王室预算中大砍挥霍性开支。她曾视为不可或缺的顾问们警告说，如此大刀阔斧的变革过于鲁莽，但玛丽斯相信，唯有非凡的领导力才能拯救这个王国。她的首要策略是透明。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她的改革议程雄心勃勃” → “她曾视为不可或缺的顾问们警告说，如此大刀阔斧的变革…” → “她的首要策略是透明” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句为主系表结构：Her reform agenda was ambitious,点明改革基调。",
                "<span class=\"keyword\">逻辑衔接</span>：She rejected the rigid ideology... , refusing to let bias confine her choices 中 refusing... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,与 rejected 并列补充。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">let sb do sth</span> 表示“让某人做某事”,此处 confine 用作动词意为“束缚”。",
                "<span class=\"keyword\">地道表达</span>：and she moved to slash wasteful spending from the royal budget 中 <span class=\"keyword\">move to do sth</span> 表示“着手做某事”,<span class=\"keyword\">slash</span> 意为“大幅削减”。",
                "<span class=\"keyword\">结构拆解</span>：Advisors she had once considered indispensable warned that... 中 she had once considered indispensable 是<span class=\"keyword\">定语从句</span>修饰 Advisors,省略了关系代词 whom/that。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：that such sweeping change was reckless 是<span class=\"keyword\">宾语从句</span>作 warned 的宾语，<span class=\"keyword\">sweeping</span> 意为“大刀阔斧的”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：only exceptional leadership could save the kingdom 是<span class=\"keyword\">宾语从句</span>作 believed 的宾语，only 强调唯一性。",
                "<span class=\"keyword\">语境搭配</span>：agenda 出现在“Her reform agenda was ambitious”中，本段取“议程”义；ideology 出现在“the rigid ideology of the old”中，本段取“意识形态”义；bias 出现在“to let bias confine her choices”中，本段取“偏见”义；confine 出现在“let bias confine her choices”中，本段取“限制”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col4-p3",
            "segments": [
              "To ",
              {
                "vocabId": "s1col4-signify",
                "text": "signify"
              },
              " a new era, the queen commissioned artists to ",
              {
                "vocabId": "s1col4-depict",
                "text": "depict"
              },
              " scenes of ordinary life rather than royal vanity, raising the public ",
              {
                "vocabId": "s1col4-profile",
                "text": "profile"
              },
              " of farmers and merchants. She courted ",
              {
                "vocabId": "s1col4-prospective",
                "text": "prospective"
              },
              " allies among the regional lords, offering fair trade in place of the favors with which her predecessors would ",
              {
                "vocabId": "s1col4-indulge",
                "text": "indulge"
              },
              " cronies. Even royal ",
              {
                "vocabId": "s1col4-recreation",
                "text": "recreation"
              },
              " was reined in; the hunting parks were opened to commoners, and the queen shared ",
              {
                "vocabId": "s1col4-intimate",
                "text": "intimate"
              },
              " conversations with villagers she once might never have met. Where once a ",
              {
                "vocabId": "s1col4-substitute",
                "text": "substitute"
              },
              " for honesty had been the court's currency, now truth prevailed."
            ],
            "analysis": {
              "translation": "为了象征一个新时代，女王委托艺术家描绘平民生活的场景，而非王室的虚荣，从而提升了农民和商人的公众形象。她在各地领主中寻求潜在盟友，以公平贸易取代前任们用来纵容亲信的恩惠。就连王室的娱乐也被加以约束；狩猎场向平民开放，女王也与她昔日也许永无机会相见的村民促膝长谈。过去曾以虚饰取代诚实作为朝廷通货，如今真相却占了上风。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “为了象征一个新时代，女王委托艺术家描绘平民生活的场…” → “就连王室的娱乐也被加以约束” → “过去曾以虚饰取代诚实作为朝廷通货，如今真相却占了上…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：To signify a new era 是<span class=\"keyword\">不定式作目的状语</span>,置于句首强调目的。",
                "<span class=\"keyword\">地道表达</span>：commissioned artists to depict scenes of ordinary life rather than royal vanity 中 <span class=\"keyword\">commission sb to do sth</span> 表示“委托某人做某事”,rather than 表对比。",
                "<span class=\"keyword\">结构拆解</span>：raising the public profile of farmers and merchants 是<span class=\"keyword\">现在分词短语作结果状语</span>,表示上述举措带来的结果。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：offering fair trade in place of the favors with which her predecessors would indulge cronies 中 offering... 与 courted 并列；with which 引导<span class=\"keyword\">定语从句</span>修饰 favors。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">in place of</span> 意为“取代”,<span class=\"keyword\">indulge cronies</span> 意为“纵容亲信”。",
                "<span class=\"keyword\">逻辑衔接</span>：the hunting parks were opened to commoners 与 the queen shared intimate conversations... 是由 and 连接的<span class=\"keyword\">并列分句</span>,分号连接前后两层语义。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：she once might never have met 是<span class=\"keyword\">定语从句</span>修饰 villagers,省略关系代词 whom。",
                "<span class=\"keyword\">结构拆解</span>：Where once a substitute for honesty had been the court's currency 是<span class=\"keyword\">地点/对比状语从句</span>,where 在此表抽象对比，now truth prevailed 为主句。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境搭配</span>：signify 出现在“To signify a new era”中，本段取“表示”义；depict 出现在“artists to depict scenes of ordinary”中，本段取“描绘”义；profile 出现在“the public profile of farmers and”中，本段取“形象”义；prospective 出现在“She courted prospective allies among the”中，本段取“预期的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s1col4-p4",
            "segments": [
              "The transformation did not come easily. Cynics demanded ",
              {
                "vocabId": "s1col4-testimony",
                "text": "testimony"
              },
              " of real results before they would believe. Yet within a decade Valdoria had become a ",
              {
                "vocabId": "s1col4-fixture",
                "text": "fixture"
              },
              " of stability in a turbulent region. On the evening the final reform passed, Maris sat alone with a cup of tea and a single ",
              {
                "vocabId": "s1col4-aspirin",
                "text": "aspirin"
              },
              " for her headache, smiling at the thought that a kingdom she had nearly lost now stood renewed."
            ],
            "analysis": {
              "translation": "这种转变来之不易。愤世嫉俗者要求在相信之前先看到真实成果的明证。然而不出十年，瓦尔多利亚已在一个动荡地区成为稳定的支柱。在最后一项改革获得通过的那个傍晚，玛丽斯独自坐着，手边一杯茶和一片治头痛的阿司匹林，一想到那个她险些失去的王国如今焕然一新，她便微笑了。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这种转变来之不易” → “不出十年，瓦尔多利亚已在一个动荡地区成为稳定的支柱” → “在最后一项改革获得通过的那个傍晚，玛丽斯独自坐着，…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句为主系表结构：The transformation did not come easily,否定词 did not 强调来之不易。",
                "<span class=\"keyword\">结构拆解</span>：demanded testimony of real results before they would believe 中 <span class=\"keyword\">demand sth of sb</span> 表示“向某人索要某物”,before they would believe 是<span class=\"keyword\">时间状语从句</span>。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：Yet within a decade Valdoria had become a fixture of stability... 表转折，<span class=\"keyword\">a fixture of stability</span> 意为“稳定的支柱/常设之物”。",
                "<span class=\"keyword\">结构拆解</span>：On the evening the final reform passed 中 the final reform passed 是<span class=\"keyword\">定语从句</span>修饰 evening,省略关系副词 when。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：Maris sat alone with a cup of tea and a single aspirin for her headache 为<span class=\"keyword\">介词短语作伴随状语</span>,描述她独坐时的细节。",
                "<span class=\"keyword\">结构拆解</span>：smiling at the thought that... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,that a kingdom she had nearly lost now stood renewed 是<span class=\"keyword\">同位语从句</span>作 thought 的同位语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：she had nearly lost 是<span class=\"keyword\">定语从句</span>修饰 kingdom,省略关系代词 which/that;renewed 为过去分词作表语/补语。",
                "<span class=\"keyword\">语境搭配</span>：testimony 出现在“Cynics demanded testimony of real results”中，本段取“证词”义；fixture 出现在“become a fixture of stability in”中，本段取“固定物”义；aspirin 出现在“a single aspirin for her headache”中，本段取“阿司匹林”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "set2",
    "number": 2,
    "label": "第二份",
    "columns": [
      {
        "id": "s2col1",
        "number": 1,
        "audio": {
          "src": "audio/list2_col1.mp3",
          "cues": [[2.14,2.64],[2.64,3.06],[3.06,3.44],null,[3.64,3.74],[3.74,4.06],[4.06,4.54],[4.54,4.78],[4.78,5.02],[5.02,5.34],[5.34,5.74],[5.74,6.4],[6.4,6.8],[6.8,7.32],[8,8.02],[8.22,8.42],[8.42,8.82],[8.82,9.16],[9.16,9.5],[9.5,9.78],[9.78,9.92],[9.92,10.14],[10.14,10.7],[11.12,11.32],[11.32,11.84],[11.84,11.9],[11.9,12.18],[12.36,12.88],[12.88,13.3],[13.3,13.82],[13.82,13.98],[13.98,14.6],[14.6,14.92],[14.92,15.06],[15.06,15.3],[15.3,15.54],[15.54,15.92],[15.92,16.46],[17.3,17.44],[17.44,17.8],[17.8,18.06],[18.06,18.24],[18.24,18.42],[18.42,18.66],[18.66,19.04],[19.04,19.38],[19.38,19.72],[19.72,20.22],[20.5,20.72],[20.72,20.96],[20.96,21.12],[21.12,21.54],[21.54,21.88],[21.88,22.42],[22.42,22.67],[22.67,22.92],[22.92,23.34],[23.34,23.68],[23.68,24.02],[24.02,24.3],[24.3,24.62],[24.62,25.14],[25.76,25.96],[25.96,26.34],[26.34,26.7],[26.7,26.96],[26.96,27.36],[27.36,27.76],[27.76,28.02],[28.02,28.68],[28.68,29.78],[29.78,29.83],[29.83,30.26],[30.26,30.64],[30.64,30.96],[30.96,31.28],[31.28,31.56],[31.56,31.7],[31.7,31.9],[31.9,32.2],[32.2,32.62],[32.62,32.92],[32.92,33.24],[33.24,33.88],[34.54,34.68],[34.68,35.12],[35.12,35.5],[35.5,35.68],[35.68,36.1],[36.1,36.36],[36.36,36.86],[36.86,37.2],[37.2,37.84],[37.84,37.87],[37.87,38.08],[38.08,38.6],[38.6,38.92],[38.92,39.12],[39.12,39.36],[39.36,39.62],[39.62,39.92],[39.92,40.18],[40.18,40.44],[40.44,40.66],[40.66,40.94],[40.94,41.28],[41.98,42.12],[42.12,42.34],[42.34,43.04],[43.04,43.08],[43.08,43.52],[43.52,44.02],[44.02,44.36],[44.36,45.04],[45.04,45.64],[45.64,45.92],[45.92,46.48],[46.48,46.98],[46.98,47.72],[47.72,48.18],[48.18,48.23],[48.23,48.7],[49.12,49.3],[49.3,49.48],[49.48,49.76],[49.76,50.2],[50.2,50.52],[50.52,50.88],[50.88,51.08],[51.08,51.36],[51.36,51.6],[51.6,52],[52.62,52.84],[52.84,53.28],[53.28,53.5],[53.5,53.72],[53.72,53.92],[53.92,54.18],[54.18,54.52],[54.52,54.9],[54.9,55.12],[55.12,55.34],[55.34,55.82],[55.82,56.16],[56.16,56.44],[56.44,56.66],[56.66,56.9],[56.9,57.16],[57.16,57.34],[57.34,57.56],[57.56,58.04],[58.66,58.82],[58.82,58.96],[58.96,59.16],[59.16,59.36],[59.36,59.46],[59.46,59.72],[59.72,60.12],[60.24,60.32],[60.32,60.58],[60.58,60.8],[60.8,61.06],[61.06,61.22],[61.22,61.44],[61.44,61.62],[61.62,61.92],[61.92,62.2],[62.2,62.56],[62.56,62.78],[62.78,63.06],[63.06,63.3],[63.3,63.52],[63.52,63.72],[63.72,63.96],[63.96,64.38],[65,65.54],null,[65.7,65.98],[65.98,66.44],[66.72,67.08],[67.08,67.32],[67.32,67.6],[67.6,68.1],null,[68.52,68.74],[68.74,68.94],[68.94,69.5],[69.5,69.8],[69.8,70.08],[70.08,70.52],[70.52,70.86],[70.86,71.1],[71.1,71.36],[71.36,71.72],[71.72,71.98],[71.98,72.32],[72.94,73.1],[73.1,73.38],[73.38,73.62],[73.62,74.18],[74.18,74.52],[74.52,74.8],[74.8,74.96],[74.96,75.16],[75.16,75.58],[75.58,75.96],[76.24,76.44],[76.44,76.84],[76.84,77.32],[77.32,77.76],[77.76,78.32],[79.1,79.28],[79.28,79.54],[79.54,79.8],[79.8,80.14],[80.14,80.4],[80.4,80.7],[80.7,80.98],[80.98,81.26],[81.26,81.42],[81.42,81.78],[81.78,82.14],[82.14,82.4],[82.4,82.68],[82.68,82.98],[82.98,83.32],[83.32,83.78],[84.52,84.66],[84.66,84.96],[84.96,85.56],[85.56,85.88],[85.88,86.14],[86.14,86.4],[86.4,86.86],[87.22,87.44],[87.44,87.72],[87.72,88.12],[88.12,88.42],[88.42,88.84],[89.24,89.38],[89.38,89.98],[89.98,90.01],[90.01,90.18],[90.18,90.7],[90.7,91.32],[91.32,91.9],[91.9,91.92],[91.92,92.1],[92.1,92.44],[92.44,92.7],[92.7,92.86],[92.86,93.16]]
        },
        "title": "第一列",
        "theme": {
          "zh": "不懈求真",
          "en": "Relentless Pursuit of Truth"
        },
        "words": [
          {
            "id": "s2col1-municipal",
            "word": "municipal",
            "pos": "adj.",
            "meaning": "市政的；地方的"
          },
          {
            "id": "s2col1-realm",
            "word": "realm",
            "pos": "n.",
            "meaning": "领域；范围"
          },
          {
            "id": "s2col1-handicapped",
            "word": "handicapped",
            "pos": "adj.",
            "meaning": "残疾的；有障碍的"
          },
          {
            "id": "s2col1-relentless",
            "word": "relentless",
            "pos": "adj.",
            "meaning": "不懈的；残酷的"
          },
          {
            "id": "s2col1-quest",
            "word": "quest",
            "pos": "n.",
            "meaning": "探索；寻求"
          },
          {
            "id": "s2col1-postpone",
            "word": "postpone",
            "pos": "v.",
            "meaning": "推迟；延期"
          },
          {
            "id": "s2col1-wipe",
            "word": "wipe",
            "pos": "v.",
            "meaning": "擦拭；消除"
          },
          {
            "id": "s2col1-deficiency",
            "word": "deficiency",
            "pos": "n.",
            "meaning": "缺乏；不足"
          },
          {
            "id": "s2col1-mortality",
            "word": "mortality",
            "pos": "n.",
            "meaning": "死亡率；必死性"
          },
          {
            "id": "s2col1-intensity",
            "word": "intensity",
            "pos": "n.",
            "meaning": "强烈；强度"
          },
          {
            "id": "s2col1-domain",
            "word": "domain",
            "pos": "n.",
            "meaning": "领域；领地"
          },
          {
            "id": "s2col1-era",
            "word": "era",
            "pos": "n.",
            "meaning": "时代；年代"
          },
          {
            "id": "s2col1-occasional",
            "word": "occasional",
            "pos": "adj.",
            "meaning": "偶尔的；不时的"
          },
          {
            "id": "s2col1-chord",
            "word": "chord",
            "pos": "n.",
            "meaning": "和弦；弦"
          },
          {
            "id": "s2col1-ignorance",
            "word": "ignorance",
            "pos": "n.",
            "meaning": "无知；愚昧"
          },
          {
            "id": "s2col1-laborious",
            "word": "laborious",
            "pos": "adj.",
            "meaning": "费力的；艰苦的"
          },
          {
            "id": "s2col1-disclose",
            "word": "disclose",
            "pos": "v.",
            "meaning": "揭露；透露"
          },
          {
            "id": "s2col1-suppress",
            "word": "suppress",
            "pos": "v.",
            "meaning": "压制；抑制"
          },
          {
            "id": "s2col1-plough",
            "word": "plough",
            "pos": "v.",
            "meaning": "犁地；艰难前行"
          },
          {
            "id": "s2col1-hermitage",
            "word": "hermitage",
            "pos": "n.",
            "meaning": "隐居处；修道院"
          },
          {
            "id": "s2col1-nuisance",
            "word": "nuisance",
            "pos": "n.",
            "meaning": "讨厌的人/物；麻烦事"
          },
          {
            "id": "s2col1-dim",
            "word": "dim",
            "pos": "adj.",
            "meaning": "昏暗的；模糊的"
          },
          {
            "id": "s2col1-fluctuation",
            "word": "fluctuation",
            "pos": "n.",
            "meaning": "波动；起伏"
          },
          {
            "id": "s2col1-monopoly",
            "word": "monopoly",
            "pos": "n.",
            "meaning": "垄断；独占"
          },
          {
            "id": "s2col1-legislator",
            "word": "legislator",
            "pos": "n.",
            "meaning": "立法者；议员"
          }
        ],
        "paragraphs": [
          {
            "id": "s2col1-p1",
            "segments": [
              "In every ",
              {
                "vocabId": "s2col1-era",
                "text": "era"
              },
              ", the ",
              {
                "vocabId": "s2col1-relentless",
                "text": "relentless"
              },
              "\n",
              {
                "vocabId": "s2col1-quest",
                "text": "quest"
              },
              " for truth has defined humanity's highest calling. Dr. Elena Hart devoted her life to this pursuit, retreating to a quiet ",
              {
                "vocabId": "s2col1-hermitage",
                "text": "hermitage"
              },
              " beside the ",
              {
                "vocabId": "s2col1-municipal",
                "text": "municipal"
              },
              " library where she could think without interruption. She believed that the ",
              {
                "vocabId": "s2col1-domain",
                "text": "domain"
              },
              " of knowledge belonged to everyone, not held in ",
              {
                "vocabId": "s2col1-monopoly",
                "text": "monopoly"
              },
              " by the privileged few who treated facts as private property."
            ],
            "analysis": {
              "translation": "在每一个时代，对真理的不懈追求都界定了人类最高尚的使命。埃琳娜·哈特博士毕生致力于这一追求，她退居到市政图书馆旁一处清静的隐居之所，以便能不受打扰地思考。她认为知识的领域属于每一个人，而不应被少数特权者所垄断——那些人把事实当作私有财产。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在每一个时代，对真理的不懈追求都界定了人类最高尚的…” → “埃琳娜·哈特博士毕生致力于这一追求，她退居到市政图…” → “她认为知识的领域属于每一个人，而不应被少数特权者所…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 the relentless quest for truth has defined humanity's highest calling,<span class=\"keyword\">define</span> 此处意为“界定、赋予意义”。",
                "<span class=\"keyword\">地道表达</span>：Dr. Elena Hart devoted her life to this pursuit 中 <span class=\"keyword\">devote one's life to</span> 表示“毕生致力于”,to 为介词。",
                "<span class=\"keyword\">逻辑衔接</span>：retreating to a quiet hermitage... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,与 devoted 并列，表示她退居的状态。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：where she could think without interruption 是<span class=\"keyword\">定语从句</span>修饰 hermitage,where 在从句中作地点状语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：She believed that the domain of knowledge belonged to everyone 中 that 引导<span class=\"keyword\">宾语从句</span>作 believed 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：not held in monopoly by the privileged few... 是<span class=\"keyword\">过去分词短语作定语</span>,修饰 everyone(实际语义指向 domain),<span class=\"keyword\">hold in monopoly</span> 意为“垄断”。",
                "<span class=\"keyword\">结构拆解</span>：who treated facts as private property 是<span class=\"keyword\">定语从句</span>修饰 the privileged few,<span class=\"keyword\">treat... as...</span> 表示“把……当作……”。",
                "<span class=\"keyword\">语境搭配</span>：era 出现在“In every era”中，本段取“时代”义；relentless 出现在“the relentless quest for truth”中，本段取“不懈的”义；quest 出现在“the relentless quest for truth has”中，本段取“探索”义；hermitage 出现在“a quiet hermitage beside the municipal”中，本段取“隐居处”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col1-p2",
            "segments": [
              "Her research focused on ",
              {
                "vocabId": "s2col1-mortality",
                "text": "mortality"
              },
              " rates in working-class districts, a ",
              {
                "vocabId": "s2col1-laborious",
                "text": "laborious"
              },
              " task that required her to ",
              {
                "vocabId": "s2col1-plough",
                "text": "plough"
              },
              " through decades of crumbling records. She refused to ",
              {
                "vocabId": "s2col1-postpone",
                "text": "postpone"
              },
              " her findings despite pressure from a powerful ",
              {
                "vocabId": "s2col1-legislator",
                "text": "legislator"
              },
              " who hoped to ",
              {
                "vocabId": "s2col1-suppress",
                "text": "suppress"
              },
              " the truth and protect his allies. The data revealed a ",
              {
                "vocabId": "s2col1-deficiency",
                "text": "deficiency"
              },
              " in public sanitation that left entire neighborhoods ",
              {
                "vocabId": "s2col1-handicapped",
                "text": "handicapped"
              },
              " for a generation, and she felt compelled to ",
              {
                "vocabId": "s2col1-disclose",
                "text": "disclose"
              },
              " it whatever the cost."
            ],
            "analysis": {
              "translation": "她的研究聚焦于工人街区的死亡率，这是一项繁重的任务，需要她翻阅数十年间残破的档案。她拒绝推迟公布自己的发现，尽管一位有权势的议员施压，希望压制真相、保护其盟友。数据揭示了公共卫生方面的缺失，这一缺失使整片街区整整一代人处于不利境地，她感到无论付出何种代价都不得不将其公之于众。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她的研究聚焦于工人街区的死亡率，这是一项繁重的任务…” → “她拒绝推迟公布自己的发现，尽管一位有权势的议员施压…” → “数据揭示了公共卫生方面的缺失，这一缺失使整片街区整…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Her research focused on mortality rates in working-class districts,<span class=\"keyword\">focus on</span> 表示“聚焦于”。",
                "<span class=\"keyword\">结构拆解</span>：a laborious task that required her to plough through decades of crumbling records 是<span class=\"keyword\">同位语</span>,对研究任务进行解释，其中 that required... 是<span class=\"keyword\">定语从句</span>修饰 task。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">require sb to do sth</span> 表示“要求某人做某事”,<span class=\"keyword\">plough through</span> 意为“费力地翻阅/啃完”。",
                "<span class=\"keyword\">结构拆解</span>：despite pressure from a powerful legislator 是<span class=\"keyword\">介词短语作让步状语</span>,despite 后接名词。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：who hoped to suppress the truth and protect his allies 是<span class=\"keyword\">定语从句</span>修饰 legislator,who 作从句主语，两个不定式并列作 hoped 的宾语。",
                "<span class=\"keyword\">结构拆解</span>：that left entire neighborhoods handicapped for a generation 是<span class=\"keyword\">定语从句</span>修饰 deficiency,<span class=\"keyword\">leave sb/sth + 过去分词/形容词</span> 表示“使……处于某种状态”。",
                "<span class=\"keyword\">地道表达</span>：she felt compelled to disclose it whatever the cost 中 <span class=\"keyword\">feel compelled to do sth</span> 表示“感到不得不做某事”,whatever the cost 为让步状语。",
                "<span class=\"keyword\">语境搭配</span>：mortality 出现在“focused on mortality rates in working-class”中，本段取“死亡率”义；laborious 出现在“a laborious task that required”中，本段取“费力的”义；plough 出现在“her to plough through decades of”中，本段取“犁地”义；postpone 出现在“refused to postpone her findings despite”中，本段取“推迟”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col1-p3",
            "segments": [
              "The ",
              {
                "vocabId": "s2col1-intensity",
                "text": "intensity"
              },
              " of her work was matched only by the ",
              {
                "vocabId": "s2col1-occasional",
                "text": "occasional"
              },
              " doubt that crept in during the long nights. In the ",
              {
                "vocabId": "s2col1-dim",
                "text": "dim"
              },
              " light of her study, she would strike a ",
              {
                "vocabId": "s2col1-chord",
                "text": "chord"
              },
              " on her old piano to steady her nerves and clear her mind. ",
              {
                "vocabId": "s2col1-ignorance",
                "text": "Ignorance"
              },
              ", she insisted, was the true ",
              {
                "vocabId": "s2col1-nuisance",
                "text": "nuisance"
              },
              " — not the ",
              {
                "vocabId": "s2col1-fluctuation",
                "text": "fluctuation"
              },
              " of public opinion or the noise beyond her window."
            ],
            "analysis": {
              "translation": "她工作的强度，只有漫长夜晚里悄然袭来的偶尔疑虑能与之相比。在书房昏暗的灯光下，她会在那架旧钢琴上弹出一个和弦来稳定心绪、澄澈心思。她坚称，真正的麻烦是愚昧无知——而不是民意的波动，或是窗外嘈杂的喧嚷。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她工作的强度，只有漫长夜晚里悄然袭来的偶尔疑虑能与…” → “在书房昏暗的灯光下，她会在那架旧钢琴上弹出一个和弦…” → “她坚称，真正的麻烦是愚昧无知——而不是民意的波动，…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The intensity of her work was matched only by the occasional doubt,<span class=\"keyword\">be matched only by</span> 表示“唯有……能与之相比”。",
                "<span class=\"keyword\">结构拆解</span>：that crept in during the long nights 是<span class=\"keyword\">定语从句</span>修饰 doubt,that 作从句主语，<span class=\"keyword\">creep in</span> 意为“悄然袭来”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：she would strike a chord on her old piano 中 <span class=\"keyword\">strike a chord</span> 字面意为“弹出一个和弦”,would 表过去习惯性动作。",
                "<span class=\"keyword\">逻辑衔接</span>：to steady her nerves and clear her mind 是<span class=\"keyword\">不定式作目的状语</span>,两个动词并列。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：she insisted 是插入语，后接<span class=\"keyword\">宾语从句</span> Ignorance... was the true nuisance(省略 that)。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后 not the fluctuation of public opinion or the noise beyond her window 是与 the true nuisance 并列的<span class=\"keyword\">否定并列成分</span>,强调无知才是真正麻烦。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">语境搭配</span>：intensity 出现在“The intensity of her work”中，本段取“强烈”义；occasional 出现在“by the occasional doubt that crept”中，本段取“偶尔的”义；dim 出现在“In the dim light of her”中，本段取“昏暗的”义；chord 出现在“strike a chord on her old”中，本段取“和弦”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col1-p4",
            "segments": [
              "When her findings finally entered the ",
              {
                "vocabId": "s2col1-realm",
                "text": "realm"
              },
              " of policy debate, they challenged every comfortable assumption. She ",
              {
                "vocabId": "s2col1-wipe",
                "text": "wiped"
              },
              " away the excuse that nothing could be done, that the past was beyond repair. Her ",
              {
                "vocabId": "s2col1-relentless",
                "text": "relentless"
              },
              " spirit proved that one person, armed with patience and evidence, could confront a hidden crisis and demand a reckoning from those in power."
            ],
            "analysis": {
              "translation": "当她的发现最终进入政策辩论的领域时，它们挑战了每一个令人安适的假设。她抹去了那种认为无计可施、过去已无可挽回的借口。她那不懈的精神证明，一个人，凭借耐心与证据，能够直面一场隐秘的危机，并要求当权者作出交代。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当她的发现最终进入政策辩论的领域时，它们挑战了每一…” → “她抹去了那种认为无计可施、过去已无可挽回的借口” → “她那不懈的精神证明，一个人，凭借耐心与证据，能够直…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句中 When her findings finally entered the realm of policy debate 是<span class=\"keyword\">时间状语从句</span>,they challenged... 为主句。",
                "<span class=\"keyword\">地道表达</span>：they challenged every comfortable assumption 中 <span class=\"keyword\">comfortable assumption</span> 意为“令人安适的(固有)假设”。",
                "<span class=\"keyword\">结构拆解</span>：She wiped away the excuse that nothing could be done, that the past was beyond repair 中两个 that 从句是<span class=\"keyword\">同位语从句</span>,并列解释 excuse 的内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">beyond repair</span> 意为“无可挽回”,介词短语作表语。",
                "<span class=\"keyword\">结构拆解</span>：Her relentless spirit proved that... 中 that one person... could confront... and demand... 是<span class=\"keyword\">宾语从句</span>作 proved 的宾语。",
                "<span class=\"keyword\">结构拆解</span>：armed with patience and evidence 是<span class=\"keyword\">过去分词短语作状语</span>,表伴随条件，意为“凭借耐心与证据”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">demand a reckoning from those in power</span> 意为“要求当权者作出交代”,reckoning 表示“清算、算账”。",
                "<span class=\"keyword\">语境搭配</span>：realm 出现在“entered the realm of policy debate”中，本段取“领域”义；wiped 出现在“She wiped away the excuse”中，本段取“擦拭”义；relentless 出现在“Her relentless spirit proved that”中，本段取“不懈的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s2col2",
        "number": 2,
        "audio": {
          "src": "audio/list2_col2.mp3",
          "cues": [[2.28,2.39],[2.39,2.5],[2.5,2.66],[2.66,3.16],[3.16,3.4],[3.4,3.6],[3.6,3.72],[3.72,3.84],[3.84,4.06],[4.06,4.16],[4.16,5.16],null,[5.16,5.22],[5.22,5.44],[5.44,5.86],[5.86,6.26],[6.26,6.58],[6.58,6.9],[6.9,7.26],[7.26,7.56],[7.56,8.14],null,[8.8,9.04],[9.04,9.24],[9.24,9.7],[9.7,9.74],[9.74,9.9],[9.9,10.56],[11.32,11.64],[11.64,12.1],[12.1,12.44],[12.44,12.72],[12.72,13.22],null,[13.62,13.84],[13.84,14.02],[14.02,14.48],[14.48,14.98],[14.98,15.62],[15.62,16.2],[16.2,16.52],[16.52,16.76],[16.76,18.2],[18.2,18.25],[18.25,18.52],[18.52,18.8],[18.8,19.24],[19.24,19.62],[19.62,20.22],[20.22,20.86],[20.86,20.9],[20.9,21.54],[21.54,21.94],[21.94,22.3],[22.3,22.48],[22.48,22.76],[22.76,23.04],[23.04,23.36],[23.36,23.44],[23.44,23.7],[23.7,24.14],[24.14,24.56],[25.18,25.38],[25.38,25.76],[25.76,26.06],[26.06,26.52],null,[26.92,27.06],[27.06,27.34],[27.34,27.9],null,[28.34,28.5],[28.5,29.24],[29.24,29.29],[29.29,29.43],[29.43,29.62],[29.62,29.96],[29.96,30.36],[30.6,30.8],[30.8,31.2],[31.2,31.66],[31.66,31.86],[31.86,32.18],[32.18,32.5],[32.5,32.84],[32.84,33.18],[33.18,33.72],[33.72,34.14],[34.14,34.42],[34.42,34.64],[34.64,34.94],[34.94,35.8],[36.72,36.78],[36.78,37.12],[37.12,37.22],[37.22,37.56],[37.56,37.84],[37.84,38.16],[38.16,38.64],[39.38,39.54],[39.54,39.84],[39.84,40.12],[40.12,40.4],[40.4,40.86],[40.86,41.14],[41.14,41.32],[41.32,41.6],[41.6,42.04],[42.62,42.96],[42.96,43.28],[43.28,43.6],[43.6,44.02],[44.02,44.56],[44.56,45.36],[45.36,45.39],[45.39,45.5],[45.5,45.72],[45.72,46],[46,46.44],[46.44,46.82],[46.82,47.26],[47.96,48.1],[48.1,48.48],[48.48,48.82],[48.82,48.98],[48.98,49.42],[49.42,49.76],[50.12,50.38],[50.38,50.7],[50.7,51.14],[51.14,51.52],[51.52,51.82],[51.82,52.28],[52.28,52.8],[52.8,53.26],[53.26,53.52],[53.52,54.3],[54.3,54.66],[54.66,55.06],[55.06,56.1],null,[56.1,56.13],[56.13,56.44],[56.44,56.82],[56.82,57.08],[57.08,57.54],[57.54,57.76],[57.76,58.08],[58.08,58.4],[58.4,58.6],[58.6,59.02],[59.02,59.12],[59.12,59.46],[59.46,59.8],[60.52,60.62],[60.62,61.26],[61.26,61.7],[61.7,62],[62,62.38],[62.38,62.86],[62.86,63.16],[63.16,63.56],[63.56,64.08],[64.08,64.28],[64.28,64.62],[64.62,64.9],[64.9,65.3],[66.02,66.38],[66.38,66.94],[66.94,67.26],[67.26,67.7],[67.7,68.06],[68.06,68.26],[68.26,68.56],[68.56,68.94],[68.94,69.3],[69.3,69.6],[69.6,69.82],[69.82,70.18],[70.18,70.5],[70.88,70.98],[70.98,71.18],[71.18,71.58],[71.58,72.04],[72.04,72.56],[72.56,72.86],[72.86,73.02],[73.02,73.2],[73.2,73.38],[73.38,73.86],[74.56,74.76],[74.76,75.02],[75.02,75.4],[75.4,75.66],[75.66,76.08],[76.26,76.42],[76.42,76.8],[76.8,77.7],[77.7,77.99],[77.99,78.28],[78.28,78.68],[78.68,79.02],[79.02,79.34],[79.34,79.76],[79.76,79.92],[79.92,80.24],[80.24,80.54],[80.54,80.84],[80.84,81.22],[81.22,81.88],[81.88,82.2],[82.2,82.58]]
        },
        "title": "第二列",
        "theme": {
          "zh": "边境小镇危机",
          "en": "Border Town Crisis"
        },
        "words": [
          {
            "id": "s2col2-maturity",
            "word": "maturity",
            "pos": "n.",
            "meaning": "成熟；完备"
          },
          {
            "id": "s2col2-sewage",
            "word": "sewage",
            "pos": "n.",
            "meaning": "污水；污物"
          },
          {
            "id": "s2col2-civic",
            "word": "civic",
            "pos": "adj.",
            "meaning": "市民的；公民的"
          },
          {
            "id": "s2col2-eligible",
            "word": "eligible",
            "pos": "adj.",
            "meaning": "合格的；有资格的"
          },
          {
            "id": "s2col2-illuminate",
            "word": "illuminate",
            "pos": "v.",
            "meaning": "照亮；阐明"
          },
          {
            "id": "s2col2-treaty",
            "word": "treaty",
            "pos": "n.",
            "meaning": "条约；协议"
          },
          {
            "id": "s2col2-moderate",
            "word": "moderate",
            "pos": "v.",
            "meaning": "缓和；节制"
          },
          {
            "id": "s2col2-prevalent",
            "word": "prevalent",
            "pos": "adj.",
            "meaning": "普遍的；流行的"
          },
          {
            "id": "s2col2-barrel",
            "word": "barrel",
            "pos": "n.",
            "meaning": "桶；桶装物"
          },
          {
            "id": "s2col2-catastrophic",
            "word": "catastrophic",
            "pos": "adj.",
            "meaning": "灾难性的"
          },
          {
            "id": "s2col2-enrolment",
            "word": "enrolment",
            "pos": "n.",
            "meaning": "注册；登记"
          },
          {
            "id": "s2col2-hostile",
            "word": "hostile",
            "pos": "adj.",
            "meaning": "敌对的；不友善的"
          },
          {
            "id": "s2col2-seize",
            "word": "seize",
            "pos": "v.",
            "meaning": "抓住；夺取"
          },
          {
            "id": "s2col2-toll",
            "word": "toll",
            "pos": "n.",
            "meaning": "通行费；代价"
          },
          {
            "id": "s2col2-prescription",
            "word": "prescription",
            "pos": "n.",
            "meaning": "处方；药方"
          },
          {
            "id": "s2col2-ferry",
            "word": "ferry",
            "pos": "n.",
            "meaning": "渡船；渡运"
          },
          {
            "id": "s2col2-predominantly",
            "word": "predominantly",
            "pos": "adv.",
            "meaning": "主要地；占主导地"
          },
          {
            "id": "s2col2-inferior",
            "word": "inferior",
            "pos": "adj.",
            "meaning": "劣等的；下级的"
          },
          {
            "id": "s2col2-grim",
            "word": "grim",
            "pos": "adj.",
            "meaning": "严酷的；阴郁的"
          },
          {
            "id": "s2col2-enforcement",
            "word": "enforcement",
            "pos": "n.",
            "meaning": "执行；实施"
          },
          {
            "id": "s2col2-finite",
            "word": "finite",
            "pos": "adj.",
            "meaning": "有限的"
          },
          {
            "id": "s2col2-sequence",
            "word": "sequence",
            "pos": "n.",
            "meaning": "顺序；连续"
          },
          {
            "id": "s2col2-collide",
            "word": "collide",
            "pos": "v.",
            "meaning": "碰撞；冲突"
          },
          {
            "id": "s2col2-cosy",
            "word": "cosy",
            "pos": "adj.",
            "meaning": "舒适的；惬意的"
          },
          {
            "id": "s2col2-prairie",
            "word": "prairie",
            "pos": "n.",
            "meaning": "大草原"
          },
          {
            "id": "s2col2-paradox",
            "word": "paradox",
            "pos": "n.",
            "meaning": "悖论；矛盾"
          },
          {
            "id": "s2col2-evolutionary",
            "word": "evolutionary",
            "pos": "adj.",
            "meaning": "进化的；演变的"
          },
          {
            "id": "s2col2-stunning",
            "word": "stunning",
            "pos": "adj.",
            "meaning": "令人震惊的；极好的"
          },
          {
            "id": "s2col2-merchant",
            "word": "merchant",
            "pos": "n.",
            "meaning": "商人"
          },
          {
            "id": "s2col2-paradise",
            "word": "paradise",
            "pos": "n.",
            "meaning": "天堂；乐园"
          }
        ],
        "paragraphs": [
          {
            "id": "s2col2-p1",
            "segments": [
              "The town of Ridgemont sat on the edge of the ",
              {
                "vocabId": "s2col2-prairie",
                "text": "prairie"
              },
              ", a once-",
              {
                "vocabId": "s2col2-cosy",
                "text": "cosy"
              },
              " settlement that travelers had called ",
              {
                "vocabId": "s2col2-paradise",
                "text": "paradise"
              },
              ". Now it faced a ",
              {
                "vocabId": "s2col2-grim",
                "text": "grim"
              },
              " reality. ",
              {
                "vocabId": "s2col2-sewage",
                "text": "Sewage"
              },
              " overflow had become ",
              {
                "vocabId": "s2col2-prevalent",
                "text": "prevalent"
              },
              ", and the ",
              {
                "vocabId": "s2col2-predominantly",
                "text": "predominantly"
              },
              " aging population struggled with ",
              {
                "vocabId": "s2col2-civic",
                "text": "civic"
              },
              " decline. A local ",
              {
                "vocabId": "s2col2-merchant",
                "text": "merchant"
              },
              " named Tomasz watched the ",
              {
                "vocabId": "s2col2-catastrophic",
                "text": "catastrophic"
              },
              " damage unfold with the ",
              {
                "vocabId": "s2col2-maturity",
                "text": "maturity"
              },
              " of someone who had survived worse."
            ],
            "analysis": {
              "translation": "里奇蒙小镇坐落于草原边缘，曾是一个被旅人称为天堂的温馨聚落。如今它却面对着严酷的现实。污水外溢已成常态，而以老年人为主的居民艰难应对着城镇的衰落。一位名叫托马斯的当地商人，以经历过更糟糕之事者的那份沉稳，注视着这场灾难性的破坏逐渐展开。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “里奇蒙小镇坐落于草原边缘，曾是一个被旅人称为天堂的…” → “污水外溢已成常态，而以老年人为主的居民艰难应对着城…” → “一位名叫托马斯的当地商人，以经历过更糟糕之事者的那…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The town of Ridgemont sat on the edge of the prairie,a once-cosy settlement that travelers had called paradise 是<span class=\"keyword\">同位语</span>。",
                "<span class=\"keyword\">结构拆解</span>：that travelers had called paradise 是<span class=\"keyword\">定语从句</span>修饰 settlement,关系代词 that 作 call 的宾语；call 在这里采用“宾语 + 宾语补足语”结构。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">逻辑衔接</span>：Sewage overflow had become prevalent 与 the predominantly aging population struggled with civic decline 是由 and 连接的<span class=\"keyword\">并列分句</span>。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">struggle with</span> 意为“艰难应对”,predominantly aging 作 population 的前置定语。",
                "<span class=\"keyword\">结构拆解</span>：watched the catastrophic damage unfold with the maturity of someone... 中 <span class=\"keyword\">watch sth unfold</span> 表示“注视某事展开”,unfold 为省略 to 的不定式作宾补。",
                "<span class=\"keyword\">结构拆解</span>：who had survived worse 是<span class=\"keyword\">定语从句</span>修饰 someone,who 作从句主语，worse 为代词指“更糟的事”。",
                "<span class=\"keyword\">语境搭配</span>：prairie 出现在“of the prairie”中，本段取“大草原”义；cosy 出现在“cosy settlement that travelers”中，本段取“舒适的”义；paradise 出现在“had called paradise”中，本段取“天堂”义；grim 出现在“faced a grim reality”中，本段取“严酷的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col2-p2",
            "segments": [
              "The town's ",
              {
                "vocabId": "s2col2-ferry",
                "text": "ferry"
              },
              " crossing — its only lifeline — drew from a ",
              {
                "vocabId": "s2col2-finite",
                "text": "finite"
              },
              " supply of fuel, and tensions began to ",
              {
                "vocabId": "s2col2-collide",
                "text": "collide"
              },
              " as two rival factions fought over the remaining supplies. ",
              {
                "vocabId": "s2col2-enforcement",
                "text": "Enforcement"
              },
              " of the old ",
              {
                "vocabId": "s2col2-treaty",
                "text": "treaty"
              },
              " had collapsed. The ",
              {
                "vocabId": "s2col2-sequence",
                "text": "sequence"
              },
              " of failures was ",
              {
                "vocabId": "s2col2-stunning",
                "text": "stunning"
              },
              " in its speed. Each ",
              {
                "vocabId": "s2col2-barrel",
                "text": "barrel"
              },
              " of contaminated water exacted a ",
              {
                "vocabId": "s2col2-toll",
                "text": "toll"
              },
              " that no ",
              {
                "vocabId": "s2col2-prescription",
                "text": "prescription"
              },
              " could cure."
            ],
            "analysis": {
              "translation": "小镇的渡口——它唯一的生命线——取自一份有限的燃料储备，而随着两个对立派系争夺剩余补给，紧张局势开始冲突。旧条约的执行已然崩溃。一连串的失败以其速度令人震惊。每一桶受污染的水都索取着任何处方都无法治愈的代价。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “小镇的渡口——它唯一的生命线——取自一份有限的燃料…” → “一连串的失败以其速度令人震惊” → “每一桶受污染的水都索取着任何处方都无法治愈的代价” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The town's ferry crossing drew from a finite supply of fuel,破折号间 its only lifeguard 是<span class=\"keyword\">同位语</span>修饰 ferry crossing。",
                "<span class=\"keyword\">结构拆解</span>：as two rival factions fought over the remaining supplies 是<span class=\"keyword\">时间/原因状语从句</span>,as 意为“随着”,<span class=\"keyword\">fight over</span> 表示“争夺”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">句子骨架</span>：Enforcement of the old treaty had collapsed 为主谓结构，<span class=\"keyword\">enforcement</span> 为名词化主语，表示“执行”。",
                "<span class=\"keyword\">地道表达</span>：The sequence of failures was stunning in its speed 中 <span class=\"keyword\">stunning in its speed</span> 表示“以其速度令人震惊”,介词短语表方面。",
                "<span class=\"keyword\">结构拆解</span>：Each barrel of contaminated water exacted a toll... 中 <span class=\"keyword\">exact a toll</span> 意为“索取代价”,contaminated 为过去分词作定语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：that no prescription could cure 是<span class=\"keyword\">定语从句</span>修饰 toll,关系代词 that 作 cure 的宾语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：ferry 出现在“The town's ferry crossing”中，本段取“渡船”义；finite 出现在“from a finite supply of fuel”中，本段取“有限的”义；collide 出现在“began to collide as two rival”中，本段取“碰撞”义；Enforcement 出现在“Enforcement of the old”中，本段取“执行”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col2-p3",
            "segments": [
              "Tomasz sought to ",
              {
                "vocabId": "s2col2-moderate",
                "text": "moderate"
              },
              " the conflict, but ",
              {
                "vocabId": "s2col2-hostile",
                "text": "hostile"
              },
              " voices would ",
              {
                "vocabId": "s2col2-seize",
                "text": "seize"
              },
              " every opportunity to escalate. He understood the ",
              {
                "vocabId": "s2col2-paradox",
                "text": "paradox"
              },
              ": a community that prided itself on harmony was now its own worst enemy. The ",
              {
                "vocabId": "s2col2-evolutionary",
                "text": "evolutionary"
              },
              " pressure of hardship revealed who people truly were beneath the surface."
            ],
            "analysis": {
              "translation": "托马斯试图调和这场冲突，但充满敌意的声音会抓住一切机会使事态升级。他明白这一悖论：一个以和谐自诩的群体，如今竟成了自己最大的敌人。苦难所产生的演化压力，揭示了人们在表象之下究竟是什么样的人。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “托马斯试图调和这场冲突，但充满敌意的声音会抓住一切…” → “他明白这一悖论：一个以和谐自诩的群体，如今竟成了自…” → “苦难所产生的演化压力，揭示了人们在表象之下究竟是什…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Tomasz sought to moderate the conflict,<span class=\"keyword\">seek to do sth</span> 表示“试图做某事”。",
                "<span class=\"keyword\">地道表达</span>：but hostile voices would seize every opportunity to escalate 表转折，<span class=\"keyword\">seize the opportunity to do sth</span> 表示“抓住机会做某事”,would 表习惯性。",
                "<span class=\"keyword\">结构拆解</span>：He understood the paradox 为主句，冒号后 a community that prided itself on harmony was now its own worst enemy 是<span class=\"keyword\">同位语从句</span>解释 paradox 的内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：that prided itself on harmony 是<span class=\"keyword\">定语从句</span>修饰 community,<span class=\"keyword\">pride oneself on sth</span> 表示“以……自诩”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：The evolutionary pressure of hardship revealed who people truly were beneath the surface 中 who 引导<span class=\"keyword\">宾语从句</span>作 revealed 的宾语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">beneath the surface</span> 意为“在表象之下”,介词短语作状语。",
                "<span class=\"keyword\">语境搭配</span>：moderate 出现在“sought to moderate the conflict”中，本段取“缓和”义；hostile 出现在“but hostile voices would seize”中，本段取“敌对的”义；seize 出现在“voices would seize every opportunity to”中，本段取“抓住”义；paradox 出现在“understood the paradox”中，本段取“悖论”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col2-p4",
            "segments": [
              "\n",
              {
                "vocabId": "s2col2-eligible",
                "text": "Eligible"
              },
              " residents saw ",
              {
                "vocabId": "s2col2-enrolment",
                "text": "enrolment"
              },
              " in the regional aid program as their last hope, yet the assistance proved ",
              {
                "vocabId": "s2col2-inferior",
                "text": "inferior"
              },
              " to what had been promised. To ",
              {
                "vocabId": "s2col2-illuminate",
                "text": "illuminate"
              },
              " the path forward, Tomasz rallied his neighbors, insisting that even ",
              {
                "vocabId": "s2col2-paradise",
                "text": "paradise"
              },
              " could be rebuilt if people chose cooperation over conflict."
            ],
            "analysis": {
              "translation": "符合条件的居民把加入地区援助项目视为最后的希望，然而所提供的援助却被证明不及承诺的那样。为了照亮前行的道路，托马斯把邻居们召集起来，坚持认为只要人们选择合作而非冲突，即便天堂也能重建。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “符合条件的居民把加入地区援助项目视为最后的希望，然…” → “为了照亮前行的道路，托马斯把邻居们召集起来，坚持认…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：Eligible residents saw enrolment in the regional aid program as their last hope 中 <span class=\"keyword\">see A as B</span> 表示“把 A 视为 B”,enrolment in 表示“加入”。",
                "<span class=\"keyword\">地道表达</span>：yet the assistance proved inferior to what had been promised 表转折，<span class=\"keyword\">prove inferior to</span> 表示“被证明不及……”。",
                "<span class=\"keyword\">结构拆解</span>：what had been promised 是<span class=\"keyword\">宾语从句</span>作介词 to 的宾语，what 作从句主语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：To illuminate the path forward 是<span class=\"keyword\">不定式作目的状语</span>,置于句首。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：Tomasz rallied his neighbors, insisting that... 中 insisting that... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,that 引导宾语从句。",
                "<span class=\"keyword\">结构拆解</span>：that even paradise could be rebuilt 是<span class=\"keyword\">宾语从句</span>作 insisting 的宾语。",
                "<span class=\"keyword\">结构拆解</span>：if people chose cooperation over conflict 是<span class=\"keyword\">条件状语从句</span>,<span class=\"keyword\">choose A over B</span> 表示“选择 A 而非 B”。",
                "<span class=\"keyword\">语境搭配</span>：Eligible 出现在“Eligible residents saw enrolment”中，本段取“合格的”义；enrolment 出现在“residents saw enrolment in the regional”中，本段取“注册”义；inferior 出现在“assistance proved inferior to what had”中，本段取“劣等的”义；illuminate 出现在“To illuminate the path forward”中，本段取“照亮”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s2col3",
        "number": 3,
        "audio": {
          "src": "audio/list2_col3.mp3",
          "cues": [[1.58,1.74],[1.74,1.9],[1.9,2.06],[2.06,2.2],[2.2,2.3],[2.3,2.54],[2.54,3.24],[3.56,3.7],[3.7,4.28],[4.28,4.5],[4.5,4.76],[4.76,5.14],[5.14,5.42],[5.42,5.74],[5.74,6.04],[6.04,6.22],[6.22,6.44],[6.44,6.74],null,[7.18,7.36],[7.36,7.52],[7.52,7.88],[7.88,8.18],[8.18,8.42],[8.42,8.66],[8.66,8.96],[8.96,9.14],[9.14,9.36],[9.36,9.66],[9.66,9.69],[9.69,9.86],null,[10.26,10.52],[10.52,10.74],[10.74,10.96],[10.96,11.24],[11.24,11.76],[11.76,11.96],[11.96,12.18],[12.18,12.36],[12.36,12.76],[13.68,13.88],[13.88,14.46],[14.46,14.6],[14.6,14.88],[14.88,14.92],[14.92,15.14],[15.14,15.56],[15.56,15.88],[15.88,16.3],[16.3,16.56],[16.56,16.88],[16.88,17.04],[17.04,17.42],[17.42,17.58],[17.58,17.74],[17.74,18.28],[18.28,18.96],[18.96,19.6],[19.6,20.06],[20.06,20.74],[21.46,21.7],[21.7,21.84],[21.84,22.08],[22.08,22.4],[22.4,22.82],[22.82,23.08],[23.08,23.3],[23.3,23.84],null,[24.64,24.82],[24.82,25.04],[25.04,25.3],[25.3,25.68],[25.68,26.14],[26.14,26.58],[26.58,27.12],[27.88,28.06],[28.06,28.46],[28.46,28.74],[28.74,29.02],[29.02,29.32],[29.32,29.58],[29.58,29.78],[29.78,29.98],[29.98,30.5],[30.5,30.98],[31.16,31.36],[31.36,31.5],[31.5,31.74],[31.74,31.98],[31.98,32.28],[32.28,32.66],[32.66,32.96],[32.96,33.26],[33.26,33.5],[33.5,33.88],[33.88,33.93],[33.93,34.18],null,[34.8,34.96],[34.96,35.44],[35.44,36.86],[36.86,36.91],[36.91,37.2],[37.2,37.46],[37.46,37.7],[37.7,37.98],[37.98,38.26],[38.26,38.66],[38.66,38.68],[38.68,38.78],[38.78,39.06],[39.06,39.44],[39.44,39.56],[39.56,39.84],[39.84,40.32],null,[41.02,41.24],[41.24,41.7],[41.7,41.74],[41.74,41.96],[41.96,42.24],[42.24,42.58],[42.58,42.92],[42.92,43.28],[43.28,43.42],[43.42,43.76],[44.52,44.72],[44.72,45.14],[45.14,45.6],[45.6,45.86],[45.86,46.12],[46.12,46.48],[46.48,46.76],[46.76,47.2],[47.2,47.5],[47.5,47.74],[47.74,48.08],[48.08,48.66],[49.2,49.44],[49.44,49.74],[49.74,50.1],[50.1,50.5],[50.86,50.96],[50.96,51.06],[51.06,51.24],[51.24,51.54],[51.54,51.88],[51.88,52.2],[52.2,52.72],[53.24,53.42],[53.42,53.72],[53.72,53.96],[53.96,54.24],[54.24,54.46],[54.46,54.8],[54.8,55.1],[55.8,55.96],[55.96,56.22],[56.22,56.42],[56.42,56.78],[56.78,56.94],[56.94,57.26],[57.26,57.58],[57.58,58.04],[58.04,58.38],[58.38,58.88],[59.6,60.02],[60.52,60.66],[60.66,61.12],[61.12,61.15],[61.15,61.36],[61.36,61.66],[61.66,62.3],[62.3,62.34],[62.34,62.52],[62.52,62.84],[63.52,63.7],[63.7,63.88],[63.88,64.06],[64.06,64.24],[64.24,64.48],[64.48,64.92],[64.92,65.36],[65.36,65.62],[65.62,66.02],[66.02,66.58],[66.58,66.63],[66.63,67.14],null,[67.96,68.22],[68.22,68.42],[68.42,68.58],[68.58,69.08],[69.08,69.54],[69.54,69.94],[69.94,70.32],[70.32,70.56],[70.56,70.96],[70.96,71.42],[71.42,71.84],[71.84,72.3],[72.3,72.66],[72.66,73.16],[73.16,73.36],[73.36,73.64],[73.64,73.96],[73.96,74.24],[74.66,74.76],[74.76,75.02],[75.02,75.46],[75.46,75.92],[75.92,76.72],[76.96,77.22],[77.22,77.5],[77.5,78.08],[78.08,78.52],[79.14,79.32],[79.32,79.52],[79.52,79.76],[79.76,80],[80,80.44],[80.44,80.5],[80.5,80.88],null,[81.34,81.82],[81.82,81.86],[81.86,82],[82,82.31],[82.31,82.67],[82.67,83.13]]
        },
        "title": "第三列",
        "theme": {
          "zh": "都市梦",
          "en": "Urban Dream"
        },
        "words": [
          {
            "id": "s2col3-cricket",
            "word": "cricket",
            "pos": "n.",
            "meaning": "蟋蟀；板球"
          },
          {
            "id": "s2col3-frustration",
            "word": "frustration",
            "pos": "n.",
            "meaning": "挫折；沮丧"
          },
          {
            "id": "s2col3-certify",
            "word": "certify",
            "pos": "v.",
            "meaning": "证明；认证"
          },
          {
            "id": "s2col3-glamorous",
            "word": "glamorous",
            "pos": "adj.",
            "meaning": "迷人的；富有魅力的"
          },
          {
            "id": "s2col3-fluid",
            "word": "fluid",
            "pos": "adj.",
            "meaning": "流动的；流体的"
          },
          {
            "id": "s2col3-aspire",
            "word": "aspire",
            "pos": "v.",
            "meaning": "渴望；立志"
          },
          {
            "id": "s2col3-metropolitan",
            "word": "metropolitan",
            "pos": "adj.",
            "meaning": "大都市的"
          },
          {
            "id": "s2col3-competence",
            "word": "competence",
            "pos": "n.",
            "meaning": "能力；胜任"
          },
          {
            "id": "s2col3-cholesterol",
            "word": "cholesterol",
            "pos": "n.",
            "meaning": "胆固醇"
          },
          {
            "id": "s2col3-dose",
            "word": "dose",
            "pos": "n.",
            "meaning": "剂量；一剂"
          },
          {
            "id": "s2col3-crawl",
            "word": "crawl",
            "pos": "v.",
            "meaning": "爬行；缓慢行进"
          },
          {
            "id": "s2col3-inertia",
            "word": "inertia",
            "pos": "n.",
            "meaning": "惰性；惯性"
          },
          {
            "id": "s2col3-uncover",
            "word": "uncover",
            "pos": "v.",
            "meaning": "揭露；发现"
          },
          {
            "id": "s2col3-subsistence",
            "word": "subsistence",
            "pos": "n.",
            "meaning": "生存；维持生活"
          },
          {
            "id": "s2col3-coordinate",
            "word": "coordinate",
            "pos": "v.",
            "meaning": "协调；配合"
          },
          {
            "id": "s2col3-evident",
            "word": "evident",
            "pos": "adj.",
            "meaning": "明显的；显然的"
          },
          {
            "id": "s2col3-regulatory",
            "word": "regulatory",
            "pos": "adj.",
            "meaning": "监管的；规范的"
          },
          {
            "id": "s2col3-pledge",
            "word": "pledge",
            "pos": "n./v.",
            "meaning": "保证；誓言"
          },
          {
            "id": "s2col3-precedent",
            "word": "precedent",
            "pos": "n.",
            "meaning": "先例；前例"
          },
          {
            "id": "s2col3-glamour",
            "word": "glamour",
            "pos": "n.",
            "meaning": "魅力；诱惑力"
          },
          {
            "id": "s2col3-aggravate",
            "word": "aggravate",
            "pos": "v.",
            "meaning": "加重；恶化"
          },
          {
            "id": "s2col3-indigenous",
            "word": "indigenous",
            "pos": "adj.",
            "meaning": "本土的；原住民的"
          },
          {
            "id": "s2col3-chronically",
            "word": "chronically",
            "pos": "adv.",
            "meaning": "长期地；慢性地"
          },
          {
            "id": "s2col3-sphere",
            "word": "sphere",
            "pos": "n.",
            "meaning": "球体；领域"
          },
          {
            "id": "s2col3-millennium",
            "word": "millennium",
            "pos": "n.",
            "meaning": "千年；千禧年"
          },
          {
            "id": "s2col3-constraint",
            "word": "constraint",
            "pos": "n.",
            "meaning": "约束；限制"
          },
          {
            "id": "s2col3-relocate",
            "word": "relocate",
            "pos": "v.",
            "meaning": "重新安置；搬迁"
          },
          {
            "id": "s2col3-cumulative",
            "word": "cumulative",
            "pos": "adj.",
            "meaning": "累积的"
          },
          {
            "id": "s2col3-catastrophe",
            "word": "catastrophe",
            "pos": "n.",
            "meaning": "灾难；大祸"
          },
          {
            "id": "s2col3-utterly",
            "word": "utterly",
            "pos": "adv.",
            "meaning": "完全地；彻底地"
          }
        ],
        "paragraphs": [
          {
            "id": "s2col3-p1",
            "segments": [
              "For as long as she could remember, Amara ",
              {
                "vocabId": "s2col3-aspire",
                "text": "aspired"
              },
              " to leave behind the slow rhythm of her village — where the only sound at dusk was the song of a ",
              {
                "vocabId": "s2col3-cricket",
                "text": "cricket"
              },
              " — and chase the ",
              {
                "vocabId": "s2col3-glamorous",
                "text": "glamorous"
              },
              " life she saw in magazines. She longed to enter a ",
              {
                "vocabId": "s2col3-sphere",
                "text": "sphere"
              },
              " where ambition was ",
              {
                "vocabId": "s2col3-fluid",
                "text": "fluid"
              },
              " and the ",
              {
                "vocabId": "s2col3-glamour",
                "text": "glamour"
              },
              " of the ",
              {
                "vocabId": "s2col3-metropolitan",
                "text": "metropolitan"
              },
              " skyline promised infinite possibility."
            ],
            "analysis": {
              "translation": "从她记事起，阿玛拉就渴望摆脱村庄缓慢的节奏——在那里，黄昏时分唯一的声响是蟋蟀的鸣唱——去追逐她在杂志上看到的那种光鲜生活。她渴望进入一个抱负如流水般灵动、都市天际线的奢华承诺着无限可能的圈子。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “从她记事起，阿玛拉就渴望摆脱村庄缓慢的节奏——在那…” → “她渴望进入一个抱负如流水般灵动、都市天际线的奢华承…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Amara aspired to leave behind the slow rhythm of her village and chase the glamorous life,aspired 后接两个并列不定式。",
                "<span class=\"keyword\">结构拆解</span>：For as long as she could remember 是<span class=\"keyword\">时间状语从句</span>,for 表持续时长。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：破折号间 where the only sound at dusk was the song of a cricket 是<span class=\"keyword\">定语从句</span>修饰 village,where 作地点状语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：she saw in magazines 是<span class=\"keyword\">定语从句</span>修饰 the glamorous life,省略关系代词 that/which。",
                "<span class=\"keyword\">地道表达</span>：She longed to enter a sphere 中 <span class=\"keyword\">long to do sth</span> 表示“渴望做某事”。",
                "<span class=\"keyword\">结构拆解</span>：where ambition was fluid 是<span class=\"keyword\">定语从句</span>修饰 sphere,fluid 此处喻指“灵动、不受拘束”。",
                "<span class=\"keyword\">逻辑衔接</span>：the glamour of the metropolitan skyline promised infinite possibility 与上句并列，说明该圈子的吸引力。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">语境搭配</span>：aspired 出现在“Amara aspired to leave behind”中，本段取“渴望”义；cricket 出现在“of a cricket”中，本段取“蟋蟀”义；glamorous 出现在“chase the glamorous life she saw”中，本段取“迷人的”义；sphere 出现在“enter a sphere where ambition was”中，本段取“球体”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col3-p2",
            "segments": [
              "But the new ",
              {
                "vocabId": "s2col3-millennium",
                "text": "millennium"
              },
              " brought its own ",
              {
                "vocabId": "s2col3-constraint",
                "text": "constraints"
              },
              ". The city, she discovered, was ",
              {
                "vocabId": "s2col3-chronically",
                "text": "chronically"
              },
              " indifferent. Rent devoured her wages until she lived at ",
              {
                "vocabId": "s2col3-subsistence",
                "text": "subsistence"
              },
              " level, and the ",
              {
                "vocabId": "s2col3-inertia",
                "text": "inertia"
              },
              " of poverty made every morning feel like a ",
              {
                "vocabId": "s2col3-crawl",
                "text": "crawl"
              },
              ". Her ",
              {
                "vocabId": "s2col3-frustration",
                "text": "frustration"
              },
              " grew. A doctor warned her that stress and a poor diet had raised her ",
              {
                "vocabId": "s2col3-cholesterol",
                "text": "cholesterol"
              },
              "; she needed a daily ",
              {
                "vocabId": "s2col3-dose",
                "text": "dose"
              },
              " of medication just to function."
            ],
            "analysis": {
              "translation": "但新千年带来了它自身的束缚。她发现，这座城市长期冷漠。房租吞噬了她的工资，直到她只能维持在温饱水平，而贫穷的惯性让每个清晨都像爬行一般。她的挫败感与日俱增。一位医生警告她，压力与糟糕的饮食已使她的胆固醇升高；她需要每天服药才能勉强维持。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “新千年带来了它自身的束缚” → “房租吞噬了她的工资，直到她只能维持在温饱水平，而贫…” → “一位医生警告她，压力与糟糕的饮食已使她的胆固醇升高” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句 But the new millennium brought its own constraints 表转折，点明新千年的束缚。",
                "<span class=\"keyword\">结构拆解</span>：The city, she discovered, was chronically indifferent 中 she discovered 为<span class=\"keyword\">插入语</span>,chronically indifferent 意为“长期冷漠”。",
                "<span class=\"keyword\">结构拆解</span>：Rent devoured her wages until she lived at subsistence level 中 <span class=\"keyword\">devour</span> 意为“吞噬”,until 引导<span class=\"keyword\">时间状语从句</span>。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">at subsistence level</span> 意为“在温饱水平”,介词短语作状语。",
                "<span class=\"keyword\">结构拆解</span>：the inertia of poverty made every morning feel like a crawl 中 <span class=\"keyword\">make sth feel like sth</span> 表示“使某物感觉像……”,feel like 为省略 to 的不定式作宾补。",
                "<span class=\"keyword\">结构拆解</span>：stress and a poor diet had raised her cholesterol 是<span class=\"keyword\">宾语从句</span>(省略 that)作 warned 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：she needed a daily dose of medication just to function 中 <span class=\"keyword\">a daily dose of</span> 表示“每日一剂”,just to function 为不定式作目的状语。",
                "<span class=\"keyword\">语境搭配</span>：millennium 出现在“the new millennium brought its own”中，本段取“千年”义；constraints 出现在“its own constraints”中，本段取“约束”义；chronically 出现在“was chronically indifferent”中，本段取“长期地”义；subsistence 出现在“lived at subsistence level”中，本段取“生存”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col3-p3",
            "segments": [
              "The ",
              {
                "vocabId": "s2col3-regulatory",
                "text": "regulatory"
              },
              " maze of urban life could ",
              {
                "vocabId": "s2col3-aggravate",
                "text": "aggravate"
              },
              " even the smallest problem. To ",
              {
                "vocabId": "s2col3-certify",
                "text": "certify"
              },
              " her credentials, she had to ",
              {
                "vocabId": "s2col3-coordinate",
                "text": "coordinate"
              },
              " with three agencies, each one setting a ",
              {
                "vocabId": "s2col3-precedent",
                "text": "precedent"
              },
              " for delay. It was ",
              {
                "vocabId": "s2col3-evident",
                "text": "evident"
              },
              " that the system favored those already inside. Still, Amara made a ",
              {
                "vocabId": "s2col3-pledge",
                "text": "pledge"
              },
              " to ",
              {
                "vocabId": "s2col3-uncover",
                "text": "uncover"
              },
              " a path forward. She could not let the ",
              {
                "vocabId": "s2col3-cumulative",
                "text": "cumulative"
              },
              " weight of setbacks become a ",
              {
                "vocabId": "s2col3-catastrophe",
                "text": "catastrophe"
              },
              "."
            ],
            "analysis": {
              "translation": "城市生活中那迷宫般的繁文缛节，连最小的问题都会加剧。为了认证她的资质，她不得不与三个机构协调，而每一个都为拖延开创了先例。显而易见，这套体系偏袒那些已经身处其中的人。尽管如此，阿玛拉立下誓言，要找到一条前行的路。她不能让挫折不断累积的重量演变成一场灾难。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “城市生活中那迷宫般的繁文缛节，连最小的问题都会加剧” → “显而易见，这套体系偏袒那些已经身处其中的人” → “她不能让挫折不断累积的重量演变成一场灾难” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The regulatory maze of urban life could aggravate even the smallest problem,<span class=\"keyword\">regulatory maze</span> 喻指“繁文缛节”。",
                "<span class=\"keyword\">结构拆解</span>：To certify her credentials 是<span class=\"keyword\">不定式作目的状语</span>,<span class=\"keyword\">certify one's credentials</span> 表示“认证资质”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：she had to coordinate with three agencies 中 <span class=\"keyword\">coordinate with</span> 表示“与……协调”。",
                "<span class=\"keyword\">结构拆解</span>：each one setting a precedent for delay 是<span class=\"keyword\">独立主格结构</span>,名词 + 现在分词，作伴随状语，<span class=\"keyword\">set a precedent for</span> 表示“为……开创先例”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：It was evident that the system favored those already inside 中 It 为形式主语，that 引导<span class=\"keyword\">主语从句</span>,those already inside 指已身处体系内的人。",
                "<span class=\"keyword\">地道表达</span>：Amara made a pledge to uncover a path forward 中 <span class=\"keyword\">make a pledge to do sth</span> 表示“立誓做某事”。",
                "<span class=\"keyword\">地道表达</span>：She could not let the cumulative weight of setbacks become a catastrophe 中 <span class=\"keyword\">let sth become sth</span> 表示“任由某事变成……”,cumulative weight 意为“不断累积的重量”。",
                "<span class=\"keyword\">语境搭配</span>：regulatory 出现在“The regulatory maze of urban”中，本段取“监管的”义；aggravate 出现在“life could aggravate even the smallest”中，本段取“加重”义；certify 出现在“To certify her credentials”中，本段取“证明”义；coordinate 出现在“had to coordinate with three agencies”中，本段取“协调”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col3-p4",
            "segments": [
              "Then came an opportunity to ",
              {
                "vocabId": "s2col3-relocate",
                "text": "relocate"
              },
              " near an ",
              {
                "vocabId": "s2col3-indigenous",
                "text": "indigenous"
              },
              " arts collective that celebrated rather than erased her roots. The move ",
              {
                "vocabId": "s2col3-utterly",
                "text": "utterly"
              },
              " transformed her. Her ",
              {
                "vocabId": "s2col3-competence",
                "text": "competence"
              },
              " finally shone. The dream had not been a mirage — only a road that demanded resilience."
            ],
            "analysis": {
              "translation": "后来出现了一个机会，让她搬到一处原住民艺术公社附近——那里颂扬而非抹去她的根基。这一举动彻底改变了她。她的才干终于闪耀出来。那个梦想并非海市蜃楼——它只不过是一条需要韧性的道路。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “来出现了一个机会，让她搬到一处原住民艺术公社附近—…” → “她的才干终于闪耀出来” → “那个梦想并非海市蜃楼——它只不过是一条需要韧性的道…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：Then came an opportunity to relocate near an indigenous arts collective 是<span class=\"keyword\">完全倒装句</span>,副词 Then 置首，谓语 came 提前，主语 an opportunity 置后。",
                "<span class=\"keyword\">结构拆解</span>：to relocate near an indigenous arts collective 是<span class=\"keyword\">不定式作后置定语</span>修饰 opportunity。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：that celebrated rather than erased her roots 是<span class=\"keyword\">定语从句</span>修饰 collective,<span class=\"keyword\">rather than</span> 连接两个并列动词 celebrated 与 erased。",
                "<span class=\"keyword\">句子骨架</span>：The move utterly transformed her 为主谓宾结构，utterly 强调程度。",
                "<span class=\"keyword\">地道表达</span>：Her competence finally shone 中 <span class=\"keyword\">shine</span> 此处意为“闪耀、显露才华”。",
                "<span class=\"keyword\">结构拆解</span>：The dream had not been a mirage 表语为 a mirage(海市蜃楼),破折号后 only a road that demanded resilience 是<span class=\"keyword\">同位语</span>,其中 that demanded resilience 是<span class=\"keyword\">定语从句</span>修饰 road。",
                "<span class=\"keyword\">语境搭配</span>：relocate 出现在“opportunity to relocate near an indigenous”中，本段取“重新安置”义；indigenous 出现在“near an indigenous arts collective that”中，本段取“本土的”义；utterly 出现在“The move utterly transformed her”中，本段取“完全地”义；competence 出现在“Her competence finally shone”中，本段取“能力”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s2col4",
        "number": 4,
        "audio": {
          "src": "audio/list2_col4.mp3",
          "cues": [[1.86,1.94],[1.94,2.2],[2.2,2.76],[2.76,2.98],[2.98,3.24],[3.24,3.56],[3.56,3.82],[3.82,3.96],[3.96,4.16],[4.16,4.38],[4.38,5.64],null,[5.64,5.67],[5.67,5.98],[5.98,6.52],[6.52,6.88],[6.88,7.42],[7.42,7.46],[7.46,7.6],[7.6,7.94],[7.94,8.36],[8.36,8.5],[8.5,8.76],[8.76,9.14],null,[10.16,10.22],[10.22,10.52],[10.52,11.14],[11.14,11.44],[11.44,11.56],[11.56,11.88],[11.88,12.38],[12.38,13.04],[13.04,13.34],[13.34,13.58],[13.58,13.86],[13.86,14.14],[14.14,14.32],[14.32,14.76],[15.52,15.68],[15.68,16.12],[16.12,16.58],[16.58,17.28],[17.28,17.74],[17.74,17.9],[17.9,18.36],[18.36,18.74],[18.74,19.4],[19.4,19.64],[19.64,20],[20.68,20.9],[20.9,21.1],[21.1,21.46],[21.46,22.18],[22.18,22.86],[22.86,23],[23,23.38],[23.38,23.82],[23.82,23.94],[23.94,24.26],[24.26,24.74],[25.56,25.86],[25.86,26.16],[26.16,26.68],[26.68,27.2],[27.2,27.62],[27.62,27.72],[27.72,28.98],[28.98,29.02],[29.02,29.2],[29.2,29.62],[29.62,30.1],[30.1,30.32],[30.32,30.44],[30.44,30.74],[30.74,31.18],[31.18,31.28],[31.28,31.52],[31.52,31.82],[31.82,32.14],null,[33.04,33.14],[33.14,33.64],[33.64,33.78],[33.78,33.96],[33.96,34.48],[34.48,34.7],[34.7,34.94],[34.94,35.42],[35.42,35.76],[35.76,35.92],[35.92,36.28],[36.28,36.62],[36.62,36.82],[37.32,37.56],[37.56,37.6],[37.6,38.22],[38.22,38.4],[38.4,38.8],[38.8,39.22],[39.22,39.36],[39.36,39.54],[39.54,39.74],[39.74,39.98],[40.78,40.86],[40.86,41.14],[41.14,41.4],[41.4,41.64],[41.64,42.06],[42.06,42.36],[42.36,42.74],[43.28,43.8],[43.8,43.87],[43.87,44.52],[44.66,44.84],[44.84,45.44],[45.44,45.76],[45.76,46.06],[46.06,46.34],[46.34,46.58],[47.38,47.58],[47.58,47.88],[48.4,48.48],[48.48,48.66],[48.66,49.14],[49.14,49.58],[49.58,49.86],[49.86,50.36],[50.36,50.58],[50.58,50.82],[50.82,51.24],[51.24,51.48],[52.16,52.36],[52.36,52.68],[52.68,53.1],[53.1,53.22],[53.22,53.54],[53.54,53.88],[53.88,54.4],[54.4,54.6],[54.6,55],[55,55.18],[55.18,56.76],[56.76,56.8],[56.8,57.08],[57.08,57.52],[57.52,58.04],[58.04,58.14],[58.14,58.64],[58.64,59.02],[59.02,59.24],[59.24,59.6],[59.6,59.76],[59.76,60.36],[61.06,61.18],[61.18,61.48],[61.48,61.92],[61.92,62.08],[62.08,62.46],[62.46,62.76],[62.76,63.08],[63.08,63.28],[63.76,63.94],[63.94,64.14],[64.14,64.3],[64.3,64.38],[64.38,64.9],[64.9,64.93],[64.93,65.18],[65.18,65.58],[66.46,66.58],[66.58,66.72],[66.72,67.1],[67.1,67.34],[67.34,67.54],[67.54,67.94],[67.94,68.26],[68.26,68.5],[68.5,68.96],[68.96,69.2],[69.2,69.48],[70.02,70.1],[70.1,70.2],[70.2,70.46],[70.46,70.7],[70.7,71.1],[71.1,71.36],[71.36,71.86],[71.86,72.02],null,[73.16,73.34],[73.34,73.46],[73.46,73.62],[73.62,73.96],[73.96,74.24],[74.24,74.6],[74.6,74.63],[74.63,74.8],[74.8,75.32],[75.32,75.66],[75.66,75.69],[75.69,75.94],[75.94,76.28],[76.28,76.52],[76.52,76.98],[76.98,77.24],[77.24,77.84],[78.6,78.7],[78.7,78.94],[78.94,79.22],[79.22,79.52],[79.52,79.9],[79.9,80.46],[80.46,80.64],[80.64,81.02],[81.26,81.4],[81.4,81.72],[81.72,81.9],[81.9,82.2]]
        },
        "title": "第四列",
        "theme": {
          "zh": "企业诉讼",
          "en": "Corporate Lawsuit"
        },
        "words": [
          {
            "id": "s2col4-endeavour",
            "word": "endeavour",
            "pos": "n./v.",
            "meaning": "努力；尽力"
          },
          {
            "id": "s2col4-quantify",
            "word": "quantify",
            "pos": "v.",
            "meaning": "量化；定量"
          },
          {
            "id": "s2col4-commodity",
            "word": "commodity",
            "pos": "n.",
            "meaning": "商品；日用品"
          },
          {
            "id": "s2col4-impair",
            "word": "impair",
            "pos": "v.",
            "meaning": "损害；削弱"
          },
          {
            "id": "s2col4-designate",
            "word": "designate",
            "pos": "v.",
            "meaning": "指定；指派"
          },
          {
            "id": "s2col4-liability",
            "word": "liability",
            "pos": "n.",
            "meaning": "责任；负债"
          },
          {
            "id": "s2col4-segregation",
            "word": "segregation",
            "pos": "n.",
            "meaning": "隔离；分离"
          },
          {
            "id": "s2col4-elimination",
            "word": "elimination",
            "pos": "n.",
            "meaning": "消除；淘汰"
          },
          {
            "id": "s2col4-supplier",
            "word": "supplier",
            "pos": "n.",
            "meaning": "供应商"
          },
          {
            "id": "s2col4-strategic",
            "word": "strategic",
            "pos": "adj.",
            "meaning": "战略的；策略的"
          },
          {
            "id": "s2col4-jury",
            "word": "jury",
            "pos": "n.",
            "meaning": "陪审团"
          },
          {
            "id": "s2col4-syndrome",
            "word": "syndrome",
            "pos": "n.",
            "meaning": "综合征；症候群"
          },
          {
            "id": "s2col4-misfortune",
            "word": "misfortune",
            "pos": "n.",
            "meaning": "不幸；灾祸"
          },
          {
            "id": "s2col4-expedition",
            "word": "expedition",
            "pos": "n.",
            "meaning": "探险；远征"
          },
          {
            "id": "s2col4-sue",
            "word": "sue",
            "pos": "v.",
            "meaning": "起诉；控告"
          },
          {
            "id": "s2col4-invasive",
            "word": "invasive",
            "pos": "adj.",
            "meaning": "侵入的；入侵的"
          },
          {
            "id": "s2col4-confrontation",
            "word": "confrontation",
            "pos": "n.",
            "meaning": "对抗；冲突"
          },
          {
            "id": "s2col4-drone",
            "word": "drone",
            "pos": "n.",
            "meaning": "无人机；雄蜂"
          },
          {
            "id": "s2col4-certification",
            "word": "certification",
            "pos": "n.",
            "meaning": "认证；证明"
          },
          {
            "id": "s2col4-retrieve",
            "word": "retrieve",
            "pos": "v.",
            "meaning": "取回；检索"
          },
          {
            "id": "s2col4-underlie",
            "word": "underlie",
            "pos": "v.",
            "meaning": "构成…的基础"
          },
          {
            "id": "s2col4-affiliate",
            "word": "affiliate",
            "pos": "n.",
            "meaning": "附属机构；分支机构"
          },
          {
            "id": "s2col4-alleviate",
            "word": "alleviate",
            "pos": "v.",
            "meaning": "减轻；缓解"
          },
          {
            "id": "s2col4-pasture",
            "word": "pasture",
            "pos": "n.",
            "meaning": "牧场；草地"
          },
          {
            "id": "s2col4-spur",
            "word": "spur",
            "pos": "v.",
            "meaning": "刺激；激励"
          },
          {
            "id": "s2col4-default",
            "word": "default",
            "pos": "n./v.",
            "meaning": "违约；默认"
          },
          {
            "id": "s2col4-spectacular",
            "word": "spectacular",
            "pos": "adj.",
            "meaning": "壮观的；惊人的"
          },
          {
            "id": "s2col4-hint",
            "word": "hint",
            "pos": "n.",
            "meaning": "暗示；线索"
          },
          {
            "id": "s2col4-grave",
            "word": "grave",
            "pos": "adj.",
            "meaning": "严重的；庄严的"
          },
          {
            "id": "s2col4-monetary",
            "word": "monetary",
            "pos": "adj.",
            "meaning": "货币的；金融的"
          }
        ],
        "paragraphs": [
          {
            "id": "s2col4-p1",
            "segments": [
              "The corporation had begun its ",
              {
                "vocabId": "s2col4-endeavour",
                "text": "endeavour"
              },
              " with the best of intentions — a ",
              {
                "vocabId": "s2col4-strategic",
                "text": "strategic"
              },
              " partnership to extract a rare ",
              {
                "vocabId": "s2col4-commodity",
                "text": "commodity"
              },
              " from the highland ",
              {
                "vocabId": "s2col4-pasture",
                "text": "pasture"
              },
              ". But ",
              {
                "vocabId": "s2col4-misfortune",
                "text": "misfortune"
              },
              " struck when an ",
              {
                "vocabId": "s2col4-invasive",
                "text": "invasive"
              },
              " drilling technique began to ",
              {
                "vocabId": "s2col4-impair",
                "text": "impair"
              },
              " the water table. Local farmers, whose livelihoods ",
              {
                "vocabId": "s2col4-underlie",
                "text": "underlie"
              },
              " the region's economy, ",
              {
                "vocabId": "s2col4-sue",
                "text": "sued"
              },
              " the company. They sought ",
              {
                "vocabId": "s2col4-monetary",
                "text": "monetary"
              },
              " compensation and the ",
              {
                "vocabId": "s2col4-elimination",
                "text": "elimination"
              },
              " of the offending operation."
            ],
            "analysis": {
              "translation": "这家公司怀着最良好的初衷开始了它的这项事业——一项战略合作伙伴关系，旨在从高原牧场开采一种稀有商品。但不幸降临：一种侵入式的钻探技术开始损害地下水位。当地农民——他们的生计是该地区经济的根基——起诉了公司。他们寻求金钱赔偿，并要求取缔这一为害的操作。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这家公司怀着最良好的初衷开始了它的这项事业——一项…” → “当地农民——他们的生计是该地区经济的根基——起诉了…” → “他们寻求金钱赔偿，并要求取缔这一为害的操作” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The corporation had begun its endeavour with the best of intentions,<span class=\"keyword\">with the best of intentions</span> 意为“怀着最良好的初衷”。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后 a strategic partnership to extract a rare commodity... 是<span class=\"keyword\">同位语</span>,解释 endeavour 的内容。",
                "<span class=\"keyword\">结构拆解</span>：to extract a rare commodity from the highland pasture 是<span class=\"keyword\">不定式作后置定语</span>修饰 partnership,<span class=\"keyword\">extract... from...</span> 表示“从……开采……”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：But misfortune struck when an invasive drilling technique began to impair the water table 中 when 引导<span class=\"keyword\">时间状语从句</span>,<span class=\"keyword\">impair</span> 意为“损害”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：whose livelihoods underlie the region's economy 是<span class=\"keyword\">定语从句</span>修饰 Local farmers,whose 作 livelihoods 的定语，<span class=\"keyword\">underlie</span> 意为“构成……的根基”。",
                "<span class=\"keyword\">地道表达</span>：They sought monetary compensation and the elimination of the offending operation 中 <span class=\"keyword\">seek sth and sth</span> 为并列宾语，offending 作 operation 的定语意为“为害的”。",
                "<span class=\"keyword\">语境搭配</span>：endeavour 出现在“begun its endeavour with the best”中，本段取“努力”义；strategic 出现在“a strategic partnership to extract”中，本段取“战略的”义；commodity 出现在“a rare commodity from the highland”中，本段取“商品”义；pasture 出现在“the highland pasture”中，本段取“牧场”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col4-p2",
            "segments": [
              "The ",
              {
                "vocabId": "s2col4-confrontation",
                "text": "confrontation"
              },
              " was ",
              {
                "vocabId": "s2col4-spectacular",
                "text": "spectacular"
              },
              " in its scale. A ",
              {
                "vocabId": "s2col4-drone",
                "text": "drone"
              },
              " captured footage of the damage, and the evidence was ",
              {
                "vocabId": "s2col4-grave",
                "text": "grave"
              },
              ". The company's lead ",
              {
                "vocabId": "s2col4-affiliate",
                "text": "affiliate"
              },
              " tried to ",
              {
                "vocabId": "s2col4-retrieve",
                "text": "retrieve"
              },
              " documents that might ",
              {
                "vocabId": "s2col4-alleviate",
                "text": "alleviate"
              },
              " the blow, but a whistleblower's ",
              {
                "vocabId": "s2col4-hint",
                "text": "hint"
              },
              " exposed what they hoped to hide. The ",
              {
                "vocabId": "s2col4-syndrome",
                "text": "syndrome"
              },
              " of corporate denial was familiar: ",
              {
                "vocabId": "s2col4-designate",
                "text": "designate"
              },
              " a scapegoat, suppress dissent, and ",
              {
                "vocabId": "s2col4-default",
                "text": "default"
              },
              " to denial."
            ],
            "analysis": {
              "translation": "这场对抗规模惊人。一架无人机拍下了受损的画面，证据十分严重。公司的主要关联机构试图取回可能减轻打击的文件，但一名举报人的线索暴露了他们想要隐瞒的内容。企业否认的综合症大家并不陌生：指定替罪羊、压制异议，并默认否认。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这场对抗规模惊人” → “公司的主要关联机构试图取回可能减轻打击的文件，但一…” → “企业否认的综合症大家并不陌生：指定替罪羊、压制异议…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句为主系表结构：The confrontation was spectacular in its scale,<span class=\"keyword\">spectacular in its scale</span> 意为“规模惊人”。",
                "<span class=\"keyword\">逻辑衔接</span>：A drone captured footage of the damage, and the evidence was grave 是由 and 连接的<span class=\"keyword\">并列分句</span>。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：The company's lead affiliate tried to retrieve documents that might alleviate the blow 中 that might alleviate the blow 是<span class=\"keyword\">定语从句</span>修饰 documents,<span class=\"keyword\">alleviate the blow</span> 意为“减轻打击”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：but a whistleblower's hint exposed what they hoped to hide 表转折，what 引导<span class=\"keyword\">宾语从句</span>作 exposed 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">句子骨架</span>：The syndrome of corporate denial was familiar 为主系表结构，冒号后列举三种表现。",
                "<span class=\"keyword\">逻辑衔接</span>：designate a scapegoat, suppress dissent, and default to denial 是三个并列的<span class=\"keyword\">动词短语</span>,作同位语解释 syndrome 的内容，<span class=\"keyword\">default to</span> 表示“默认退守到”。",
                "<span class=\"keyword\">语境搭配</span>：confrontation 出现在“The confrontation was spectacular in”中，本段取“对抗”义；spectacular 出现在“confrontation was spectacular in its scale”中，本段取“壮观的”义；drone 出现在“A drone captured footage of”中，本段取“无人机”义；grave 出现在“evidence was grave”中，本段取“严重的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col4-p3",
            "segments": [
              "In court, the ",
              {
                "vocabId": "s2col4-jury",
                "text": "jury"
              },
              " listened as lawyers tried to ",
              {
                "vocabId": "s2col4-quantify",
                "text": "quantify"
              },
              " the harm. The ",
              {
                "vocabId": "s2col4-segregation",
                "text": "segregation"
              },
              " of the affected communities from clean water was undeniable. A ",
              {
                "vocabId": "s2col4-supplier",
                "text": "supplier"
              },
              " testified that the ",
              {
                "vocabId": "s2col4-certification",
                "text": "certification"
              },
              " of safety had been falsified. The ",
              {
                "vocabId": "s2col4-expedition",
                "text": "expedition"
              },
              " to gather evidence had taken months, and now it would ",
              {
                "vocabId": "s2col4-spur",
                "text": "spur"
              },
              " a landmark ruling."
            ],
            "analysis": {
              "translation": "法庭上，陪审团聆听着律师们试图量化损害的过程。受影响社区与清洁水源的隔离不可否认。一名供应商作证说，安全认证已被伪造。为收集证据而展开的远征历时数月，而如今它将催生一项里程碑式的裁决。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “法庭上，陪审团聆听着律师们试图量化损害的过程” → “一名供应商作证说，安全认证已被伪造” → “为收集证据而展开的远征历时数月，而如今它将催生一项…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 the jury listened as lawyers tried to quantify the harm,as 引导<span class=\"keyword\">时间状语从句</span>。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">quantify the harm</span> 意为“量化损害”,作 tried 的宾语(不定式)。",
                "<span class=\"keyword\">地道表达</span>：The segregation of the affected communities from clean water was undeniable 中 <span class=\"keyword\">segregation of A from B</span> 表示“A 与 B 的隔离”,为主语核心。",
                "<span class=\"keyword\">结构拆解</span>：A supplier testified that the certification of safety had been falsified 中 that 引导<span class=\"keyword\">宾语从句</span>作 testified 的宾语，<span class=\"keyword\">falsify</span> 意为“伪造”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：The expedition to gather evidence had taken months 中 to gather evidence 是<span class=\"keyword\">不定式作后置定语</span>修饰 expedition。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：and now it would spur a landmark ruling 表并列结果，<span class=\"keyword\">spur a landmark ruling</span> 意为“催生一项里程碑式裁决”。",
                "<span class=\"keyword\">语境搭配</span>：jury 出现在“the jury listened as lawyers”中，本段取“陪审团”义；quantify 出现在“tried to quantify the harm”中，本段取“量化”义；segregation 出现在“The segregation of the affected”中，本段取“隔离”义；supplier 出现在“A supplier testified that the”中，本段取“供应商”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s2col4-p4",
            "segments": [
              "The judge noted that no settlement could fully restore the land, but the ruling would confirm the company's ",
              {
                "vocabId": "s2col4-liability",
                "text": "liability"
              },
              ". What had gone wrong was not a single mistake but a culture that treated nature as expendable. The ",
              {
                "vocabId": "s2col4-endeavour",
                "text": "endeavour"
              },
              " to rebuild trust, the judge said, must begin with honesty."
            ],
            "analysis": {
              "translation": "法官指出，没有任何赔偿能完全恢复这片土地，但这项裁决将确认公司的责任。出问题的并非单一失误，而是一种把自然视作可随意牺牲的文化。法官说，重建信任的努力必须从诚实开始。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “法官指出，没有任何赔偿能完全恢复这片土地，但这项裁…” → “出问题的并非单一失误，而是一种把自然视作可随意牺牲…” → “法官说，重建信任的努力必须从诚实开始” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 The judge noted that no settlement could fully restore the land,that 引导<span class=\"keyword\">宾语从句</span>作 noted 的宾语，<span class=\"keyword\">restore the land</span> 意为“恢复土地”。",
                "<span class=\"keyword\">结构拆解</span>：but the ruling would confirm the company's liability 表转折，与上一宾语从句构成语义对比。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：What had gone wrong was not a single mistake but a culture... 中 What 引导<span class=\"keyword\">主语从句</span>,<span class=\"keyword\">not A but B</span> 结构表示“不是 A 而是 B”。",
                "<span class=\"keyword\">结构拆解</span>：that treated nature as expendable 是<span class=\"keyword\">定语从句</span>修饰 culture,<span class=\"keyword\">treat... as expendable</span> 表示“把……视为可随意牺牲”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：The endeavour to rebuild trust, the judge said, must begin with honesty 中 the judge said 为<span class=\"keyword\">插入语</span>。",
                "<span class=\"keyword\">结构拆解</span>：to rebuild trust 是<span class=\"keyword\">不定式作后置定语</span>修饰 endeavour,<span class=\"keyword\">begin with</span> 表示“以……开始”。",
                "<span class=\"keyword\">语境搭配</span>：liability 出现在“the company's liability”中，本段取“责任”义；endeavour 出现在“The endeavour to rebuild trust”中，本段取“努力”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "set3",
    "number": 3,
    "label": "第三份",
    "columns": [
      {
        "id": "s3col1",
        "number": 1,
        "audio": {
          "src": "audio/list3_col1.mp3",
          "cues": [[2.7,2.78],[2.78,2.86],[2.86,3.04],[3.04,3.18],[3.18,3.38],[3.38,4],[4.22,4.24],[4.24,4.7],[4.7,4.96],[4.96,5.24],[5.24,5.5],[5.5,6],[6,6.34],[6.34,6.66],[6.66,6.92],[6.92,7.18],[7.18,7.56],[7.56,8.1],[8.1,8.7],[9.42,9.62],[9.62,9.96],[9.96,10.4],[10.82,11],[11.3,11.83],[11.83,12.14],[12.14,12.88],[13.06,13.22],[13.22,13.52],[13.52,13.88],[13.88,14.24],[14.24,14.62],[14.62,14.86],[14.86,15.08],[15.08,15.36],[15.36,15.68],[15.68,16.2],null,[16.68,16.86],[16.86,17.08],[17.08,17.32],[17.32,17.74],[17.74,18.22],[18.22,18.96],[18.96,19.5],[19.5,19.94],[19.94,20.32],[20.32,20.58],[20.58,21.1],[21.78,22.04],[22.22,22.46],[22.46,22.7],[22.7,23.08],null,[23.5,23.76],[23.76,24.14],[24.14,24.3],[24.3,24.46],[24.46,24.64],[24.64,24.8],[24.8,25.16],[25.16,25.58],[25.58,25.88],[25.88,26.34],[26.94,27.1],[27.1,27.34],[27.34,27.76],[27.76,27.79],[27.79,28],[28,28.5],[28.5,29.2],[29.2,29.66],[29.66,29.69],[29.69,29.94],[29.94,30.68],[31.2,31.34],[31.34,31.7],[31.7,32.1],[32.1,32.34],[32.34,32.6],[32.6,32.8],[32.8,33.02],[33.02,33.16],[33.16,33.42],[33.74,33.96],[33.96,34.18],[34.18,34.38],[34.38,34.78],[35.36,35.78],[35.78,36.4],[36.4,36.9],[36.9,37.14],[37.14,37.36],[37.36,37.84],[38.08,38.38],[38.38,38.68],[38.68,38.9],[38.9,39.16],[39.16,39.58],[39.58,40.1],[40.1,40.68],[41.14,41.36],[41.36,41.56],[41.56,41.82],[41.82,42.02],[42.02,42.46],[42.46,42.72],[42.72,43.06],[43.06,43.36],[43.36,43.84],[43.84,44.26],[44.26,44.74],[44.74,45.16],[45.16,45.46],[45.46,45.84],[46.42,46.6],[46.6,46.86],[47.04,47.24],[47.24,47.6],[47.6,48],[48,48.14],[48.14,48.68],[48.82,48.92],[48.92,49.34],[49.34,49.62],[49.62,50],[50,50.34],[50.34,50.52],[50.52,50.8],[50.8,51.1],[51.1,51.34],[51.34,52.38],[52.38,52.8],[52.8,53.22],[53.24,53.6],[53.6,54],[54,54.44],[54.44,54.88],[54.88,55.34],[55.34,55.88],[56.58,56.76],[56.76,57.14],[57.14,57.56],[57.56,58.12],[58.62,58.8],[58.8,59.02],[59.02,59.24],[59.24,59.5],[59.5,59.86],[59.86,60.46],[60.46,60.9],[60.9,61.24],[61.24,61.46],[61.46,61.94],[62.56,62.84],[62.84,63.42],[63.42,63.88],[63.88,64.24],[64.24,64.98],[64.98,65.4],[65.4,65.64],[65.64,65.86],[65.86,66.06],[66.06,66.26],[66.26,66.58],[66.58,66.86],[66.86,67.36],[67.36,67.53],[67.53,67.7],[67.7,68.04],[68.04,68.08],[68.08,68.42],null,[68.94,69.14],[69.14,69.36],[69.36,69.6],[69.6,70],[70,70.68],[70.68,70.73],[70.73,70.92],[70.92,71.16],[71.16,71.52],[71.52,71.88],[72.38,72.54],[72.54,72.78],[72.78,73.1],[73.1,73.46],[73.46,73.8],[73.8,74.34],[74.34,74.76],[75.14,75.36],[75.36,75.66],[75.66,76.04],[76.04,76.38],[76.38,76.82],[76.82,77.24],[77.24,77.48],[77.48,77.9],[77.9,78.72],[78.72,79.48],[79.48,79.7],[79.7,80.04],[80.04,80.6],[81.04,81.2],[81.2,81.38],[81.38,81.62],[81.62,82],[82.24,82.38],[82.38,82.68],[82.68,83.2],[83.2,83.24],[83.24,83.46],[83.46,83.96],[83.96,84.42],[84.42,84.9],[84.9,85.22],[85.22,85.52],[85.52,85.94],[85.94,86.64],[87.66,87.89],[87.89,88.12],[88.12,88.44],[88.44,88.78],[88.78,89.32],null,[90.1,90.62],[90.72,90.96],[90.96,91.3],[91.3,91.66],[91.88,91.98],[91.98,92.22],[92.22,92.62],[92.62,92.84],[92.84,93.38],[94.12,94.18],[94.18,94.56],[94.56,94.94],[94.94,95.26],[95.26,95.66],[95.66,95.92],[95.92,97.53],[97.53,97.68],[97.68,97.94],[97.94,98.22],[98.22,98.58],[98.58,98.98],[98.98,99.2],[99.2,99.66],[100.56,100.92],[100.92,101.26],[101.26,101.48],[101.48,101.68],[101.68,102],[102,102.32],[102.96,103.22],[103.22,103.48],[103.48,103.9],[103.9,104.2],[104.2,104.62],[104.62,105.02],[105.02,105.68],[105.68,105.7],[105.7,105.72],[105.72,106.04],[106.04,106.4],[106.4,106.82],[106.82,107.52],[107.52,108.12],[108.12,108.52],[108.52,108.76],[108.76,109],[109,109.26],[109.26,109.52]]
        },
        "title": "第一列",
        "theme": {
          "zh": "星海探微",
          "en": "A Researcher's Galactic Discovery"
        },
        "words": [
          {
            "id": "s3col1-persist",
            "word": "persist",
            "pos": "v.",
            "meaning": "坚持；持续"
          },
          {
            "id": "s3col1-adversary",
            "word": "adversary",
            "pos": "n.",
            "meaning": "对手；敌手"
          },
          {
            "id": "s3col1-assume",
            "word": "assume",
            "pos": "v.",
            "meaning": "假定；假设；承担"
          },
          {
            "id": "s3col1-endorse",
            "word": "endorse",
            "pos": "v.",
            "meaning": "赞同；认可；代言"
          },
          {
            "id": "s3col1-intimacy",
            "word": "intimacy",
            "pos": "n.",
            "meaning": "亲密；密切关系"
          },
          {
            "id": "s3col1-galactic",
            "word": "galactic",
            "pos": "adj.",
            "meaning": "银河的；星系的"
          },
          {
            "id": "s3col1-intuitive",
            "word": "intuitive",
            "pos": "adj.",
            "meaning": "直觉的；凭直觉的"
          },
          {
            "id": "s3col1-skeptical",
            "word": "skeptical",
            "pos": "adj.",
            "meaning": "怀疑的；持怀疑态度的"
          },
          {
            "id": "s3col1-assert",
            "word": "assert",
            "pos": "v.",
            "meaning": "断言；坚称；主张"
          },
          {
            "id": "s3col1-conducive",
            "word": "conducive",
            "pos": "adj.",
            "meaning": "有助于…的；有益的"
          },
          {
            "id": "s3col1-inevitably",
            "word": "inevitably",
            "pos": "adv.",
            "meaning": "不可避免地；必然地"
          },
          {
            "id": "s3col1-formulate",
            "word": "formulate",
            "pos": "v.",
            "meaning": "构想；制定；系统阐述"
          },
          {
            "id": "s3col1-stake",
            "word": "stake",
            "pos": "n.",
            "meaning": "赌注；利害关系；股份"
          },
          {
            "id": "s3col1-provision",
            "word": "provision",
            "pos": "n.",
            "meaning": "供应；预备；规定"
          },
          {
            "id": "s3col1-irrational",
            "word": "irrational",
            "pos": "adj.",
            "meaning": "不理性的；无理性的"
          },
          {
            "id": "s3col1-dawn",
            "word": "dawn",
            "pos": "n.",
            "meaning": "黎明；开端"
          },
          {
            "id": "s3col1-bulk",
            "word": "bulk",
            "pos": "n.",
            "meaning": "大部分；体积；大块"
          },
          {
            "id": "s3col1-miniature",
            "word": "miniature",
            "pos": "adj.",
            "meaning": "微型的；缩小的"
          },
          {
            "id": "s3col1-graze",
            "word": "graze",
            "pos": "v.",
            "meaning": "擦过；掠过；吃草"
          },
          {
            "id": "s3col1-ingenuity",
            "word": "ingenuity",
            "pos": "n.",
            "meaning": "独创性；心灵手巧；足智多谋"
          },
          {
            "id": "s3col1-exploitation",
            "word": "exploitation",
            "pos": "n.",
            "meaning": "开发；利用；剥削"
          },
          {
            "id": "s3col1-retreat",
            "word": "retreat",
            "pos": "v.",
            "meaning": "撤退；退避"
          },
          {
            "id": "s3col1-embed",
            "word": "embed",
            "pos": "v.",
            "meaning": "嵌入；植入；使深留"
          },
          {
            "id": "s3col1-distort",
            "word": "distort",
            "pos": "v.",
            "meaning": "扭曲；歪曲；使失真"
          },
          {
            "id": "s3col1-deem",
            "word": "deem",
            "pos": "v.",
            "meaning": "认为；视为"
          },
          {
            "id": "s3col1-publicity",
            "word": "publicity",
            "pos": "n.",
            "meaning": "宣传；公众关注"
          },
          {
            "id": "s3col1-pyramid",
            "word": "pyramid",
            "pos": "n.",
            "meaning": "金字塔；棱锥体"
          },
          {
            "id": "s3col1-sculpture",
            "word": "sculpture",
            "pos": "n.",
            "meaning": "雕塑；雕刻品"
          },
          {
            "id": "s3col1-tilt",
            "word": "tilt",
            "pos": "v.",
            "meaning": "倾斜；翘起"
          },
          {
            "id": "s3col1-illiterate",
            "word": "illiterate",
            "pos": "adj.",
            "meaning": "文盲的；不会读写的"
          },
          {
            "id": "s3col1-stray",
            "word": "stray",
            "pos": "v.",
            "meaning": "迷路；偏离"
          },
          {
            "id": "s3col1-dividend",
            "word": "dividend",
            "pos": "n.",
            "meaning": "股息；红利；回报"
          }
        ],
        "paragraphs": [
          {
            "id": "s3col1-p1",
            "segments": [
              "At the ",
              {
                "vocabId": "s3col1-dawn",
                "text": "dawn"
              },
              " of her career, Lina refused to let senior colleagues ",
              {
                "vocabId": "s3col1-assume",
                "text": "assume"
              },
              " her ideas were merely ",
              {
                "vocabId": "s3col1-intuitive",
                "text": "intuitive"
              },
              " guesses. Her chief rival, Dr. Mercer—a formidable ",
              {
                "vocabId": "s3col1-adversary",
                "text": "adversary"
              },
              "—would ",
              {
                "vocabId": "s3col1-assert",
                "text": "assert"
              },
              " in every meeting that her theories were ",
              {
                "vocabId": "s3col1-irrational",
                "text": "irrational"
              },
              ", and would ",
              {
                "vocabId": "s3col1-deem",
                "text": "deem"
              },
              " her unorthodox methods hardly ",
              {
                "vocabId": "s3col1-conducive",
                "text": "conducive"
              },
              " to real science. Yet Lina would ",
              {
                "vocabId": "s3col1-persist",
                "text": "persist"
              },
              ", convinced that the ",
              {
                "vocabId": "s3col1-bulk",
                "text": "bulk"
              },
              " of the evidence supported her vision."
            ],
            "analysis": {
              "translation": "在职业生涯之初，莉娜拒绝让资深同事以为她的想法不过是凭直觉的猜测。她的主要对手默瑟博士——一个难以对付的劲敌——会在每次会议上断言她的理论是不理性的，并把她不落俗套的方法视为几乎无益于真正的科学。然而莉娜会坚持下去，她确信大部分证据都支持她的设想。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在职业生涯之初，莉娜拒绝让资深同事以为她的想法不过…” → “她的主要对手默瑟博士——一个难以对付的劲敌——会在…” → “莉娜会坚持下去，她确信大部分证据都支持她的设想” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Lina refused to let senior colleagues assume...,<span class=\"keyword\">refuse to do sth</span> 表示“拒绝做某事”。",
                "<span class=\"keyword\">结构拆解</span>：her ideas were merely intuitive guesses 是<span class=\"keyword\">宾语从句</span>作 assume 的宾语(省略 that),merely 意为“不过、仅仅”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">逻辑衔接</span>：Dr. Mercer—a formidable adversary—would assert... 中破折号间 a formidable adversary 是<span class=\"keyword\">同位语</span>,would assert 表过去习惯性动作。",
                "<span class=\"keyword\">结构拆解</span>：that her theories were irrational 是<span class=\"keyword\">宾语从句</span>作 assert 的宾语。",
                "<span class=\"keyword\">地道表达</span>：and would deem her unorthodox methods hardly conducive to real science 中 <span class=\"keyword\">deem A (to be) B</span> 表示“把 A 视为 B”,<span class=\"keyword\">conducive to</span> 意为“有益于”。",
                "<span class=\"keyword\">结构拆解</span>：convinced that the bulk of the evidence supported her vision 是<span class=\"keyword\">过去分词短语作原因/伴随状语</span>,that 引导宾语从句作 convinced 的宾语。",
                "<span class=\"keyword\">语境搭配</span>：dawn 出现在“At the dawn of her career”中，本段取“黎明”义；assume 出现在“senior colleagues assume her ideas were”中，本段取“假定”义；intuitive 出现在“were merely intuitive guesses”中，本段取“直觉的”义；adversary 出现在“a formidable adversary”中，本段取“对手”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col1-p2",
            "segments": [
              "She worked in a modest hilltop observatory where a ",
              {
                "vocabId": "s3col1-miniature",
                "text": "miniature"
              },
              " telescope, its aging mount quick to ",
              {
                "vocabId": "s3col1-tilt",
                "text": "tilt"
              },
              " in the wind, was all she had. Colleagues, deeply ",
              {
                "vocabId": "s3col1-skeptical",
                "text": "skeptical"
              },
              " of her ambition, watched her ",
              {
                "vocabId": "s3col1-stray",
                "text": "stray"
              },
              " from accepted research paths. They warned that the ",
              {
                "vocabId": "s3col1-exploitation",
                "text": "exploitation"
              },
              " of such limited equipment would ",
              {
                "vocabId": "s3col1-inevitably",
                "text": "inevitably"
              },
              "\n",
              {
                "vocabId": "s3col1-distort",
                "text": "distort"
              },
              " her data. But Lina, whose grandmother had been ",
              {
                "vocabId": "s3col1-illiterate",
                "text": "illiterate"
              },
              " yet possessed an ",
              {
                "vocabId": "s3col1-intimacy",
                "text": "intimacy"
              },
              " with the night sky that credentialed scholars envied, trusted that ",
              {
                "vocabId": "s3col1-ingenuity",
                "text": "ingenuity"
              },
              " could outshine privilege."
            ],
            "analysis": {
              "translation": "她在一座简朴的山顶天文台工作，那里只有一架微型望远镜，其老化的支架在风中极易倾斜。同事们对她的雄心深感怀疑，看着她偏离公认的研究路径。他们警告说，使用如此有限的设备必然会扭曲她的数据。但是莉娜——她的祖母虽不识字，却拥有一种令有文凭的学者都艳羡的与夜空的亲近——相信才智能够胜过特权。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她在一座简朴的山顶天文台工作，那里只有一架微型望远…” → “他们警告说，使用如此有限的设备必然会扭曲她的数据” → “莉娜——她的祖母虽不识字，却拥有一种令有文凭的学者…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 She worked in a modest hilltop observatory,where 引导<span class=\"keyword\">定语从句</span>修饰 observatory,where 作地点状语。",
                "<span class=\"keyword\">结构拆解</span>：its aging mount quick to tilt in the wind 是<span class=\"keyword\">独立主格结构</span>,名词 + 形容词短语，作伴随状语补充说明望远镜支架。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境辨析</span>：Colleagues, deeply skeptical of her ambition, watched her stray from accepted research paths 中 deeply skeptical of... 是<span class=\"keyword\">形容词短语作插入定语</span>修饰 Colleagues。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">watch sb do sth</span> 表示“看着某人做某事”,stray 为省略 to 的不定式作宾补，<span class=\"keyword\">stray from</span> 意为“偏离”。",
                "<span class=\"keyword\">结构拆解</span>：They warned that the exploitation of such limited equipment would inevitably distort her data 中 that 引导<span class=\"keyword\">宾语从句</span>作 warned 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：whose grandmother had been illiterate yet possessed an intimacy with the night sky... 是<span class=\"keyword\">定语从句</span>修饰 Lina,whose 作 grandmother 的定语，yet 连接两个并列谓语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：that credentialed scholars envied 是<span class=\"keyword\">定语从句</span>修饰 intimacy,省略关系代词 that/which。",
                "<span class=\"keyword\">结构拆解</span>：trusted that ingenuity could outshine privilege 中 that 引导<span class=\"keyword\">宾语从句</span>,<span class=\"keyword\">outshine</span> 意为“胜过、使……相形见绌”。",
                "<span class=\"keyword\">语境搭配</span>：miniature 出现在“where a miniature telescope”中，本段取“微型的”义；tilt 出现在“quick to tilt in the wind”中，本段取“倾斜”义；skeptical 出现在“deeply skeptical of her ambition”中，本段取“怀疑的”义；stray 出现在“watched her stray from accepted research”中，本段取“迷路”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col1-p3",
            "segments": [
              "To ",
              {
                "vocabId": "s3col1-formulate",
                "text": "formulate"
              },
              " her hypothesis, she had to ",
              {
                "vocabId": "s3col1-embed",
                "text": "embed"
              },
              " fresh calculations into old star maps. Each observation let faint comet-trails ",
              {
                "vocabId": "s3col1-graze",
                "text": "graze"
              },
              " the edges of her charts like the carved lines of a ",
              {
                "vocabId": "s3col1-sculpture",
                "text": "sculpture"
              },
              ", or the layered steps of a ",
              {
                "vocabId": "s3col1-pyramid",
                "text": "pyramid"
              },
              " rising toward truth. She made ",
              {
                "vocabId": "s3col1-provision",
                "text": "provision"
              },
              " for every possible error, refusing to ",
              {
                "vocabId": "s3col1-retreat",
                "text": "retreat"
              },
              " when funding stalled and advisers withdrew. The ",
              {
                "vocabId": "s3col1-stake",
                "text": "stake"
              },
              " was enormous: if she was right, she would reveal a hidden ",
              {
                "vocabId": "s3col1-galactic",
                "text": "galactic"
              },
              " current invisible to far larger instruments."
            ],
            "analysis": {
              "translation": "为了形成她的假说，她不得不把新的计算嵌入旧的星图。每一次观测都让微弱的彗尾轻触她图表的边缘，如同雕塑上刻出的线条，又如同层层叠叠向真理升起的金字塔阶梯。她为每一种可能的误差都做了准备，在资金停滞、顾问退出时也拒绝退缩。利害攸关：如果她是对的，她将揭示一道隐形的星系暗流，那是远比它庞大的仪器都无法看见的。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “为了形成她的假说，她不得不把新的计算嵌入旧的星图” → “她为每一种可能的误差都做了准备，在资金停滞、顾问退…” → “利害攸关：如果她是对的，她将揭示一道隐形的星系暗流…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 she had to embed fresh calculations into old star maps,To formulate her hypothesis 是<span class=\"keyword\">不定式作目的状语</span>。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">embed A into B</span> 表示“把 A 嵌入 B”,formulate 意为“形成、系统阐述”。",
                "<span class=\"keyword\">结构拆解</span>：Each observation let faint comet-trails graze the edges of her charts 中 <span class=\"keyword\">let sb/sth do sth</span> 表示“让……做……”,graze 为省略 to 的不定式作宾补，意为“轻触”。",
                "<span class=\"keyword\">结构拆解</span>：like the carved lines of a sculpture, or the layered steps of a pyramid rising toward truth 是<span class=\"keyword\">介词短语作方式状语</span>,rising toward truth 为现在分词短语作后置定语修饰 pyramid。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：She made provision for every possible error 中 <span class=\"keyword\">make provision for</span> 表示“为……做准备/预留余地”。",
                "<span class=\"keyword\">结构拆解</span>：refusing to retreat when funding stalled and advisers withdrew 是<span class=\"keyword\">现在分词短语作伴随状语</span>,when 引导<span class=\"keyword\">时间状语从句</span>,stalled 意为“停滞”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：if she was right, she would reveal a hidden galactic current invisible to far larger instruments 中 if 引导<span class=\"keyword\">条件状语从句</span>,invisible to... 为形容词短语作后置定语修饰 current。",
                "<span class=\"keyword\">语境搭配</span>：formulate 出现在“To formulate her hypothesis”中，本段取“构想”义；embed 出现在“had to embed fresh calculations into”中，本段取“嵌入”义；graze 出现在“faint comet-trails graze the edges of”中，本段取“擦过”义；sculpture 出现在“of a sculpture”中，本段取“雕塑”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col1-p4",
            "segments": [
              "Months passed with little ",
              {
                "vocabId": "s3col1-publicity",
                "text": "publicity"
              },
              ". Then, one frozen morning, the data aligned at last. Lina could finally ",
              {
                "vocabId": "s3col1-endorse",
                "text": "endorse"
              },
              " her own conclusion—a ribbon of dark matter threading the galaxy, exactly where her models had pointed. What critics once deemed fantasy now paid a generous ",
              {
                "vocabId": "s3col1-dividend",
                "text": "dividend"
              },
              " of recognition, and universities rushed to ",
              {
                "vocabId": "s3col1-endorse",
                "text": "endorse"
              },
              " her work."
            ],
            "analysis": {
              "translation": "几个月过去，几乎没有引起关注。后来，在一个冰冷的清晨，数据终于吻合了。莉娜终于可以认可自己的结论——一条暗物质带穿过星系，正位于她的模型所指之处。批评者曾视为幻想的东西，如今带来了丰厚的认可回报，各大学也争相认可她的工作。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “几个月过去，几乎没有引起关注” → “莉娜终于可以认可自己的结论——一条暗物质带穿过星系…” → “批评者曾视为幻想的东西，如今带来了丰厚的认可回报，…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句 Months passed with little publicity 为主谓结构，with little publicity 为<span class=\"keyword\">介词短语作伴随状语</span>。",
                "<span class=\"keyword\">地道表达</span>：Then, one frozen morning, the data aligned at last 中 one frozen morning 为<span class=\"keyword\">时间状语</span>,aligned 意为“吻合、对齐”。",
                "<span class=\"keyword\">地道表达</span>：Lina could finally endorse her own conclusion 中 <span class=\"keyword\">endorse</span> 意为“认可、背书”。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后 a ribbon of dark matter threading the galaxy 是<span class=\"keyword\">同位语</span>,解释 conclusion 的内容，threading the galaxy 为现在分词短语作后置定语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：exactly where her models had pointed 是<span class=\"keyword\">地点状语从句</span>,where 引导，补充说明暗物质带的位置。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：What critics once deemed fantasy 是<span class=\"keyword\">主语从句</span>,作主句主语，now paid a generous dividend of recognition 为谓语部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">pay a dividend of</span> 意为“带来……的回报”,and universities rushed to endorse her work 表并列结果。",
                "<span class=\"keyword\">语境搭配</span>：publicity 出现在“with little publicity”中，本段取“宣传”义；endorse 出现在“could finally endorse her own conclusion”中，本段取“赞同”义；dividend 出现在“a generous dividend of recognition”中，本段取“股息”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s3col2",
        "number": 2,
        "audio": {
          "src": "audio/list3_col2.mp3",
          "cues": [[2.3,2.64],[2.88,3.58],[3.58,3.62],[3.62,3.94],[3.94,4.52],null,[5.34,5.56],[5.56,6.28],[6.28,6.6],[6.6,7.26],[7.26,7.44],[7.44,7.84],[7.84,8.2],[8.2,9.14],[9.14,9.38],[9.38,9.64],[9.64,9.76],[9.76,9.96],[9.96,10.16],[10.16,10.42],[11.46,11.52],[11.52,11.78],[11.78,12.2],[12.2,12.44],[12.44,12.82],[12.82,12.86],[12.86,13.26],[13.26,13.74],[14.64,14.94],[14.94,15.22],[15.22,15.48],[15.48,15.9],[15.9,16.24],[16.24,16.64],[16.64,16.9],[16.9,17.12],[17.12,17.42],[17.42,17.7],[17.7,18.02],[18.02,18.3],[18.3,18.64],[19.14,19.4],[19.4,20.04],[20.04,20.72],[20.72,20.86],[20.86,21.1],[21.1,21.76],[21.76,22.14],[22.14,22.38],[23.26,23.4],[23.4,23.5],[23.5,23.74],[23.74,24.18],[24.18,24.64],[24.64,24.84],[24.84,25.04],[25.04,25.18],[25.18,25.44],null,[26.14,26.46],[26.46,26.58],[26.58,26.96],null,[27.64,27.74],[27.74,27.92],[27.92,28.3],[28.5,28.66],[28.66,29.1],[29.64,29.76],[29.76,29.9],[29.9,30.16],[30.16,30.54],[30.54,30.72],[30.72,31],[31,31.58],[31.58,31.98],null,[32.7,32.92],[32.92,33.14],[33.14,33.5],[33.5,33.66],[33.66,33.84],[33.84,34.02],[34.02,34.2],[35.04,35.28],[35.28,35.66],[35.66,35.88],[35.88,36.24],[36.24,36.62],[36.62,37.08],[37.08,37.24],[37.24,37.54],[37.54,37.92],[38.94,39.44],null,[39.44,39.8],[39.8,40.08],[40.08,40.42],[40.42,40.82],[40.82,41.08],[41.08,41.14],[41.14,41.42],[41.42,42.04],[42.04,42.5],[42.5,42.94],[42.94,43.28],[43.28,43.4],[43.4,43.78],[43.78,44.26],[44.26,44.66],[44.66,45.14],[45.14,45.38],[45.38,45.54],[45.54,45.76],[45.76,46.1],[47.16,47.52],[47.9,48.2],[48.42,48.74],[48.74,48.92],[48.92,49.38],[49.38,49.84],[49.84,50.1],[50.1,50.42],[50.42,50.7],[51,51.26],[51.26,51.5],[51.5,51.82],[51.82,51.98],[51.98,52.3],[52.3,52.68],[52.68,52.8],[52.8,52.96],[52.96,53.46],[53.46,54],[54,54.14],[54.14,54.32],[54.32,54.56],[54.56,54.84],[54.84,55.04],[55.04,55.56],[56.4,56.52],[56.52,56.72],[56.72,56.98],[56.98,57.14],[57.14,57.74],[57.74,57.92],[57.92,58.12],[58.12,58.44],[58.44,58.78],null,[59.5,59.68],[59.68,60],[60,60.72],[60.72,61.12],[61.12,61.18],[61.18,61.4],[61.4,61.62],[61.62,61.84],[61.84,62.2],[62.2,62.36],[62.36,62.6],[62.6,62.82],[62.82,63.02],[63.78,63.96],[63.96,64.1],[64.1,64.34],[64.34,64.5],[64.5,65.06],[65.06,65.26],[65.26,65.7],[65.7,65.98],[65.98,66.3],[66.3,67.48],[67.48,67.51],[67.51,67.84],[67.84,68.24],[68.24,68.62],[68.62,69.42],[69.42,69.68],[69.68,69.92],[69.92,70.52],[70.52,70.66],[70.66,71.02],[71.02,71.36],[71.36,71.64],[71.64,71.8],[71.8,72.16],[73,73.16],[73.16,73.46],[73.46,73.72],[73.72,74.28],[74.28,74.64],[75.08,75.12],[75.12,75.38],[75.38,75.74],[75.74,76.02],[77.18,77.3],[77.3,77.44],[77.44,77.58],[77.58,77.92],[77.92,78.52],[78.52,78.55],[78.55,78.76],[78.76,79.12],[79.12,79.42],[79.42,79.68],null,[80.3,80.38],[80.38,80.64],[81.24,81.54],[81.54,81.8],[81.8,82.1],[82.1,82.42],[82.74,83.02],[83.02,83.06],[83.06,83.24],[83.24,83.58],[83.58,83.84],[84.42,84.56],[84.56,84.88],[85.22,85.44],[85.44,85.74],[85.74,86.02],[86.02,86.36],[86.36,86.84],[86.84,86.94],[86.94,87.94],[87.94,88.08],[88.08,88.4],[88.4,88.78],[88.78,89.18],[89.18,89.4],[89.4,89.66],[89.66,89.88],[89.88,90.28],[90.28,90.66],[90.66,91.42],[91.42,91.88],[91.88,92.22],[92.22,92.64],null,[93.32,93.54],[93.54,93.76],[93.76,93.98],[93.98,94.28],[94.28,94.68],[94.68,95.14],[95.14,95.28],[95.28,95.5],[95.5,96.16],[96.64,96.74],[96.74,97.26],[97.26,97.46],[97.46,97.68],[97.68,98.16],[98.16,98.6],[98.6,99.22],[99.22,99.52],[99.52,99.96],[99.96,100.22],[100.22,100.29],[100.29,100.56],[101.28,101.38],[101.38,101.64],[101.64,102.02],[102.02,102.14],[102.14,102.46],[102.46,102.76],[102.76,103.1],[103.1,103.5],[103.5,103.72],[104.3,104.52],[104.52,104.62],[104.62,104.78],[104.78,104.98],[104.98,105.22],[105.22,105.44],[105.44,105.74],[105.74,106.04],[106.04,106.18],[106.18,106.48],[106.48,106.76],[106.76,106.9],[106.9,107.04],[107.04,107.36],[108.24,108.64],[108.64,108.98],[108.98,109.48],[109.48,109.76],[109.76,110],[110,110.32],[110.32,110.56],[111.18,111.3],[111.3,111.76],[111.76,112.22],[113,113.12],[113.12,113.46],[114,114.3],[115,115.02],[115.02,115.14],[115.14,115.44],[115.44,115.78],[115.78,116.18],[116.18,116.36],[116.36,116.64],[116.64,116.9]]
        },
        "title": "第二列",
        "theme": {
          "zh": "心灵重启",
          "en": "Rediscovering the Essence of Life"
        },
        "words": [
          {
            "id": "s3col2-presumably",
            "word": "presumably",
            "pos": "adv.",
            "meaning": "大概；据推测"
          },
          {
            "id": "s3col2-essence",
            "word": "essence",
            "pos": "n.",
            "meaning": "本质；精髓"
          },
          {
            "id": "s3col2-entail",
            "word": "entail",
            "pos": "v.",
            "meaning": "需要；使成为必需"
          },
          {
            "id": "s3col2-disruption",
            "word": "disruption",
            "pos": "n.",
            "meaning": "扰乱；中断"
          },
          {
            "id": "s3col2-curve",
            "word": "curve",
            "pos": "n.",
            "meaning": "曲线；弧线"
          },
          {
            "id": "s3col2-devastating",
            "word": "devastating",
            "pos": "adj.",
            "meaning": "毁灭性的；破坏性极强的"
          },
          {
            "id": "s3col2-psychiatrist",
            "word": "psychiatrist",
            "pos": "n.",
            "meaning": "精神科医生"
          },
          {
            "id": "s3col2-outperform",
            "word": "outperform",
            "pos": "v.",
            "meaning": "胜过；表现优于"
          },
          {
            "id": "s3col2-exaggeration",
            "word": "exaggeration",
            "pos": "n.",
            "meaning": "夸张；夸大"
          },
          {
            "id": "s3col2-feat",
            "word": "feat",
            "pos": "n.",
            "meaning": "壮举；功绩"
          },
          {
            "id": "s3col2-advocacy",
            "word": "advocacy",
            "pos": "n.",
            "meaning": "提倡；拥护；辩护"
          },
          {
            "id": "s3col2-intrigue",
            "word": "intrigue",
            "pos": "v.",
            "meaning": "激起好奇心；引起兴趣"
          },
          {
            "id": "s3col2-excel",
            "word": "excel",
            "pos": "v.",
            "meaning": "擅长；突出"
          },
          {
            "id": "s3col2-verge",
            "word": "verge",
            "pos": "n.",
            "meaning": "边缘"
          },
          {
            "id": "s3col2-protagonist",
            "word": "protagonist",
            "pos": "n.",
            "meaning": "主角；主人公"
          },
          {
            "id": "s3col2-explicit",
            "word": "explicit",
            "pos": "adj.",
            "meaning": "明确的；清楚的"
          },
          {
            "id": "s3col2-carbohydrate",
            "word": "carbohydrate",
            "pos": "n.",
            "meaning": "碳水化合物"
          },
          {
            "id": "s3col2-hectic",
            "word": "hectic",
            "pos": "adj.",
            "meaning": "忙乱的；繁忙的"
          },
          {
            "id": "s3col2-legitimate",
            "word": "legitimate",
            "pos": "adj.",
            "meaning": "合理的；合法的"
          },
          {
            "id": "s3col2-strand",
            "word": "strand",
            "pos": "n.",
            "meaning": "一股；一缕"
          },
          {
            "id": "s3col2-satire",
            "word": "satire",
            "pos": "n.",
            "meaning": "讽刺；讽刺作品"
          },
          {
            "id": "s3col2-timber",
            "word": "timber",
            "pos": "n.",
            "meaning": "木材；木料"
          },
          {
            "id": "s3col2-dwell",
            "word": "dwell",
            "pos": "v.",
            "meaning": "细想；居住（常与 on 连用）"
          },
          {
            "id": "s3col2-redundant",
            "word": "redundant",
            "pos": "adj.",
            "meaning": "多余的；冗余的"
          },
          {
            "id": "s3col2-crude",
            "word": "crude",
            "pos": "adj.",
            "meaning": "粗糙的；粗略的"
          },
          {
            "id": "s3col2-imminent",
            "word": "imminent",
            "pos": "adj.",
            "meaning": "迫近的；即将发生的"
          },
          {
            "id": "s3col2-blur",
            "word": "blur",
            "pos": "v.",
            "meaning": "（使）变模糊"
          },
          {
            "id": "s3col2-desperate",
            "word": "desperate",
            "pos": "adj.",
            "meaning": "绝望的；拼命的"
          },
          {
            "id": "s3col2-thorough",
            "word": "thorough",
            "pos": "adj.",
            "meaning": "彻底的；详尽的"
          },
          {
            "id": "s3col2-calcium",
            "word": "calcium",
            "pos": "n.",
            "meaning": "钙"
          },
          {
            "id": "s3col2-imperative",
            "word": "imperative",
            "pos": "adj.",
            "meaning": "必要的；迫切的"
          },
          {
            "id": "s3col2-refuge",
            "word": "refuge",
            "pos": "n.",
            "meaning": "避难所；庇护"
          },
          {
            "id": "s3col2-probe",
            "word": "probe",
            "pos": "v.",
            "meaning": "探查；探究"
          },
          {
            "id": "s3col2-propel",
            "word": "propel",
            "pos": "v.",
            "meaning": "推进；推动"
          }
        ],
        "paragraphs": [
          {
            "id": "s3col2-p1",
            "segments": [
              "Dr. Halloran, a seasoned ",
              {
                "vocabId": "s3col2-psychiatrist",
                "text": "psychiatrist"
              },
              ", studied Elena—the ",
              {
                "vocabId": "s3col2-protagonist",
                "text": "protagonist"
              },
              " of this quiet clinical drama—who sat on the ",
              {
                "vocabId": "s3col2-verge",
                "text": "verge"
              },
              " of collapse. Her ",
              {
                "vocabId": "s3col2-hectic",
                "text": "hectic"
              },
              " schedule had become a ",
              {
                "vocabId": "s3col2-devastating",
                "text": "devastating"
              },
              " force; sleep and meals had eroded until the days would ",
              {
                "vocabId": "s3col2-blur",
                "text": "blur"
              },
              " into one another, each indistinguishable from the last, draining her further. It was no ",
              {
                "vocabId": "s3col2-exaggeration",
                "text": "exaggeration"
              },
              " to say she was ",
              {
                "vocabId": "s3col2-desperate",
                "text": "desperate"
              },
              "."
            ],
            "analysis": {
              "translation": "经验丰富的精神科医生霍洛兰博士研究着埃琳娜——这出安静的临床戏剧的主角——她坐在崩溃的边缘。她那繁密的日程已成为一股毁灭性的力量；睡眠与饮食不断被侵蚀，直到日子彼此模糊成一团，每一天都和前一天难以区分，把她进一步掏空。说她已陷入绝境，毫不夸张。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “经验丰富的精神科医生霍洛兰博士研究着埃琳娜——这出…” → “她那繁密的日程已成为一股毁灭性的力量” → “说她已陷入绝境，毫不夸张” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Dr. Halloran studied Elena,破折号间 the protagonist of this quiet clinical drama 是<span class=\"keyword\">同位语</span>修饰 Elena。",
                "<span class=\"keyword\">结构拆解</span>：who sat on the verge of collapse 是<span class=\"keyword\">定语从句</span>修饰 Elena,who 作从句主语，<span class=\"keyword\">on the verge of</span> 意为“在……的边缘”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：Her hectic schedule had become a devastating force 为主系表结构，devastating 为现在分词转化来的形容词。",
                "<span class=\"keyword\">结构拆解</span>：sleep and meals had eroded until the days would blur into one another 中 until 引导<span class=\"keyword\">时间状语从句</span>,<span class=\"keyword\">blur into one another</span> 意为“彼此模糊成一团”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：each indistinguishable from the last 是<span class=\"keyword\">独立主格结构</span>,代词 + 形容词短语，作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：draining her further 是<span class=\"keyword\">现在分词短语作结果状语</span>,表示上述状态带来的后果。",
                "<span class=\"keyword\">结构拆解</span>：It was no exaggeration to say she was desperate 中 It 为形式主语，to say... 为<span class=\"keyword\">不定式作真正主语</span>,she was desperate 是省略 that 的宾语从句。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：psychiatrist 出现在“a seasoned psychiatrist”中，本段取“精神科医生”义；protagonist 出现在“the protagonist of this quiet”中，本段取“主角”义；verge 出现在“on the verge of collapse”中，本段取“边缘”义；hectic 出现在“Her hectic schedule had become”中，本段取“忙乱的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col2-p2",
            "segments": [
              "\"It is ",
              {
                "vocabId": "s3col2-imperative",
                "text": "imperative"
              },
              ",\" he said gently, leaning forward, \"that we ",
              {
                "vocabId": "s3col2-probe",
                "text": "probe"
              },
              " what your life actually ",
              {
                "vocabId": "s3col2-entail",
                "text": "entails"
              },
              ", not merely what you fear it might.\""
            ],
            "analysis": {
              "translation": "“我们必须探究你的生活实际上意味着什么，而不仅仅是你害怕它可能意味着什么，”他身体前倾，温和地说道。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段用一句话集中交代 “我们必须探究你的生活实际上意味着什么，而不仅仅是你…”。先抓住并列的主干动作，再看修饰语补充的结果或影响。",
                "<span class=\"keyword\">句子骨架</span>：引语主干为 It is imperative that we probe...,It 为形式主语，that 引导<span class=\"keyword\">主语从句</span>,imperative 意为“至关重要的”,从句用动词原形 probe(虚拟语气)。",
                "<span class=\"keyword\">结构拆解</span>：he said gently, leaning forward 中 he said 为<span class=\"keyword\">插入语</span>,leaning forward 为现在分词短语作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：what your life actually entails 是<span class=\"keyword\">宾语从句</span>作 probe 的宾语，what 作 entails 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：not merely what you fear it might 是与上一宾语从句并列的<span class=\"keyword\">宾语从句</span>,what 作 fear 的宾语，it might 后省略了 entail。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">not merely</span> 意为“不仅仅”,与上文 actually 形成对比。",
                "<span class=\"keyword\">语境搭配</span>：imperative 出现在“It is imperative”中，本段取“必要的”义；probe 出现在“that we probe what your life”中，本段取“探查”义；entails 出现在“life actually entails”中，本段取“需要”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col2-p3",
            "segments": [
              "Elena had come seeking ",
              {
                "vocabId": "s3col2-refuge",
                "text": "refuge"
              },
              " from an ",
              {
                "vocabId": "s3col2-imminent",
                "text": "imminent"
              },
              " breakdown. ",
              {
                "vocabId": "s3col2-presumably",
                "text": "Presumably"
              },
              ", she believed therapy would be a ",
              {
                "vocabId": "s3col2-crude",
                "text": "crude"
              },
              " patch—a ",
              {
                "vocabId": "s3col2-redundant",
                "text": "redundant"
              },
              " ritual she could simply outlast before returning to her old routines. Instead, Dr. Halloran's ",
              {
                "vocabId": "s3col2-thorough",
                "text": "thorough"
              },
              " questions began to ",
              {
                "vocabId": "s3col2-intrigue",
                "text": "intrigue"
              },
              " her, pulling her toward an honesty she had long avoided."
            ],
            "analysis": {
              "translation": "埃琳娜前来，是希望从一场迫在眉睫的崩溃中寻求庇护。据推测，她认为治疗不过是一块粗糙的补丁——一种多余的仪式，她只需熬过去，便能回到旧日的日常。然而，霍洛兰博士缜密的提问开始引起她的兴趣，把她引向一种她长久以来一直回避的诚实。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “埃琳娜前来，是希望从一场迫在眉睫的崩溃中寻求庇护” → “据推测，她认为治疗不过是一块粗糙的补丁——一种多余…” → “霍洛兰博士缜密的提问开始引起她的兴趣，把她引向一种…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：Elena had come seeking refuge from an imminent breakdown 中 seeking refuge... 是<span class=\"keyword\">现在分词短语作目的状语</span>,<span class=\"keyword\">seek refuge from</span> 意为“从……寻求庇护”。",
                "<span class=\"keyword\">结构拆解</span>：Presumably, she believed therapy would be a crude patch 中 presumably 为<span class=\"keyword\">评注性副词</span>,that 引导的宾语从句省略了 that。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：破折号后 a redundant ritual she could simply outlast 是<span class=\"keyword\">同位语</span>修饰 a crude patch,其中 she could simply outlast 是<span class=\"keyword\">定语从句</span>修饰 ritual(省略 that)。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：before returning to her old routines 是<span class=\"keyword\">介词 before + 动名词</span>作时间状语，<span class=\"keyword\">outlast</span> 意为“熬过、比……更持久”。",
                "<span class=\"keyword\">地道表达</span>：Instead, Dr. Halloran's thorough questions began to intrigue her 表转折，<span class=\"keyword\">intrigue</span> 意为“引起兴趣”。",
                "<span class=\"keyword\">结构拆解</span>：pulling her toward an honesty she had long avoided 是<span class=\"keyword\">现在分词短语作结果状语</span>,she had long avoided 是<span class=\"keyword\">定语从句</span>修饰 honesty(省略 that)。",
                "<span class=\"keyword\">语境搭配</span>：refuge 出现在“come seeking refuge from an imminent”中，本段取“避难所”义；imminent 出现在“from an imminent breakdown”中，本段取“迫近的”义；Presumably 出现在“Presumably”中，本段取“大概”义；crude 出现在“be a crude patch”中，本段取“粗糙的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col2-p4",
            "segments": [
              "He did not ",
              {
                "vocabId": "s3col2-dwell",
                "text": "dwell"
              },
              " on symptoms alone. He asked about her diet—was she getting enough ",
              {
                "vocabId": "s3col2-calcium",
                "text": "calcium"
              },
              ", enough ",
              {
                "vocabId": "s3col2-carbohydrate",
                "text": "carbohydrate"
              },
              " to fuel a body that still tried to ",
              {
                "vocabId": "s3col2-excel",
                "text": "excel"
              },
              " at work? She had tried to ",
              {
                "vocabId": "s3col2-outperform",
                "text": "outperform"
              },
              " every colleague by skipping meals, a ",
              {
                "vocabId": "s3col2-legitimate",
                "text": "legitimate"
              },
              " but misguided strategy that only sharpened the downward ",
              {
                "vocabId": "s3col2-curve",
                "text": "curve"
              },
              " of her energy."
            ],
            "analysis": {
              "translation": "他并不只停留在症状上。他询问她的饮食——她是否摄取了足够的钙、足够的碳水化合物，来为一具仍试图在工作中出类拔萃的身体提供能量?她曾试图靠少吃几顿饭来胜过每一位同事，这是一种合理却失之偏颇的策略，只会让她精力的下行曲线更加陡峭。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他并不只停留在症状上” → “他询问她的饮食——她是否摄取了足够的钙、足够的碳水…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句 He did not dwell on symptoms alone 中 <span class=\"keyword\">dwell on</span> 意为“老是想着、停留在”,alone 表“仅仅”。",
                "<span class=\"keyword\">结构拆解</span>：He asked about her diet 为主句，破折号后 was she getting enough calcium, enough carbohydrate... 是<span class=\"keyword\">宾语从句</span>(间接疑问句)补充说明询问内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：to fuel a body that still tried to excel at work 是<span class=\"keyword\">不定式作目的状语</span>,that still tried to excel at work 是<span class=\"keyword\">定语从句</span>修饰 body。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：She had tried to outperform every colleague by skipping meals 中 <span class=\"keyword\">outperform</span> 意为“胜过”,by skipping meals 为方式状语。",
                "<span class=\"keyword\">逻辑衔接</span>：a legitimate but misguided strategy 是<span class=\"keyword\">同位语</span>,对前面的做法进行评价，but 连接两个并列形容词。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：that only sharpened the downward curve of her energy 是<span class=\"keyword\">定语从句</span>修饰 strategy,<span class=\"keyword\">sharpen</span> 此处意为“使……更陡峭”。",
                "<span class=\"keyword\">语境搭配</span>：dwell 出现在“did not dwell on symptoms alone”中，本段取“细想”义；calcium 出现在“getting enough calcium”中，本段取“钙”义；carbohydrate 出现在“enough carbohydrate to fuel a”中，本段取“碳水化合物”义；excel 出现在“tried to excel at work”中，本段取“擅长”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col2-p5",
            "segments": [
              "Rather than issue ",
              {
                "vocabId": "s3col2-explicit",
                "text": "explicit"
              },
              " commands, he wove small metaphors. \"Think of your resilience as a single ",
              {
                "vocabId": "s3col2-strand",
                "text": "strand"
              },
              " of ",
              {
                "vocabId": "s3col2-timber",
                "text": "timber"
              },
              ",\" he said. \"One beam can hold, but a roof needs many.\" She smiled, sensing the mild ",
              {
                "vocabId": "s3col2-satire",
                "text": "satire"
              },
              " in his tone—he was gently mocking the myth that one person, alone, could accomplish every ",
              {
                "vocabId": "s3col2-feat",
                "text": "feat"
              },
              "."
            ],
            "analysis": {
              "translation": "他并不下达明确的命令，而是编织一些小小的比喻。“把你的韧性想象成一根木材，”他说，“一根横梁能撑住，但一个屋顶需要许多根。”她笑了，察觉到他语气中含蓄的讥讽——他在温和地嘲弄那种认为一个人独自就能完成每一项壮举的神话。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他并不下达明确的命令，而是编织一些小小的比喻” → “把你的韧性想象成一根木材，他说，一根横梁能撑住，但…” → “她笑了，察觉到他语气中含蓄的讥讽——他在温和地嘲弄…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句 Rather than issue explicit commands, he wove small metaphors 中 Rather than issue... 是<span class=\"keyword\">rather than + 动词原形</span>作对比状语，<span class=\"keyword\">weave metaphors</span> 意为“编织比喻”。",
                "<span class=\"keyword\">地道表达</span>：Think of your resilience as a single strand of timber 是祈使句，<span class=\"keyword\">think of A as B</span> 表示“把 A 想象成 B”。",
                "<span class=\"keyword\">逻辑衔接</span>：One beam can hold, but a roof needs many 是由 but 连接的<span class=\"keyword\">并列分句</span>,many 为代词指代 many beams。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：She smiled, sensing the mild satire in his tone 中 sensing... 是<span class=\"keyword\">现在分词短语作伴随状语</span>,<span class=\"keyword\">mild satire</span> 意为“含蓄的讥讽”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：破折号后 he was gently mocking the myth that... 是对 sensing 内容的<span class=\"keyword\">解释性同位</span>,that one person, alone, could accomplish every feat 是<span class=\"keyword\">同位语从句</span>解释 myth 的内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境辨析</span>：alone 为<span class=\"keyword\">插入副词</span>,强调“独自一人”。",
                "<span class=\"keyword\">语境搭配</span>：explicit 出现在“than issue explicit commands”中，本段取“明确的”义；strand 出现在“a single strand of timber”中，本段取“一股”义；timber 出现在“strand of timber”中，本段取“木材”义；satire 出现在“the mild satire in his tone”中，本段取“讽刺”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col2-p6",
            "segments": [
              "Through weeks of quiet ",
              {
                "vocabId": "s3col2-advocacy",
                "text": "advocacy"
              },
              " for her own well-being, Elena learned to ",
              {
                "vocabId": "s3col2-propel",
                "text": "propel"
              },
              " herself forward, one small choice at a time. The ",
              {
                "vocabId": "s3col2-disruption",
                "text": "disruption"
              },
              " of old habits was painful at first, yet it gave her room to breathe and to notice what had been lost. Slowly, she rediscovered the ",
              {
                "vocabId": "s3col2-essence",
                "text": "essence"
              },
              " of living: not constant achievement, but balance, rest, and the quiet courage to ask for help."
            ],
            "analysis": {
              "translation": "经过数周为自己福祉的悄然宣导，埃琳娜学会了每次以一个小小的选择推动自己前行。旧习惯的打破起初是痛苦的，然而它给了她喘息的空间，让她注意到那些已然失去的东西。慢慢地，她重新发现了生活的本质：不是不断的成就，而是平衡、休息，以及开口求助的那份静默的勇气。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “经过数周为自己福祉的悄然宣导，埃琳娜学会了每次以一…” → “旧习惯的打破起初是痛苦的，然而它给了她喘息的空间，…” → “慢慢地，她重新发现了生活的本质：不是不断的成就，而…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Elena learned to propel herself forward,Through weeks of quiet advocacy... 为<span class=\"keyword\">介词短语作时间状语</span>。",
                "<span class=\"keyword\">结构拆解</span>：to propel herself forward 是<span class=\"keyword\">不定式作宾语</span>,one small choice at a time 为方式状语，表示“每次一个小小的选择”。",
                "<span class=\"keyword\">句子骨架</span>：The disruption of old habits was painful at first 为主系表结构，disruption 为名词化主语。",
                "<span class=\"keyword\">结构拆解</span>：yet it gave her room to breathe and to notice what had been lost 表转折，what had been lost 是<span class=\"keyword\">宾语从句</span>作 notice 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：Slowly, she rediscovered the essence of living 中 <span class=\"keyword\">the essence of living</span> 意为“生活的本质”。",
                "<span class=\"keyword\">逻辑衔接</span>：冒号后 not constant achievement, but balance, rest, and the quiet courage to ask for help 是<span class=\"keyword\">同位语</span>,解释 essence 的内容，采用 <span class=\"keyword\">not A but B</span> 结构。",
                "<span class=\"keyword\">结构拆解</span>：to ask for help 是<span class=\"keyword\">不定式作后置定语</span>修饰 courage。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：advocacy 出现在“of quiet advocacy for her own”中，本段取“提倡”义；propel 出现在“learned to propel herself forward”中，本段取“推进”义；disruption 出现在“The disruption of old habits”中，本段取“扰乱”义；essence 出现在“rediscovered the essence of living”中，本段取“本质”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s3col3",
        "number": 3,
        "audio": {
          "src": "audio/list3_col3.mp3",
          "cues": [[2.78,2.92],[3.08,3.26],[3.26,3.64],[3.64,3.98],[3.98,4.22],[4.22,4.54],[4.54,4.78],[4.78,5.04],[5.04,5.36],[5.36,5.74],[5.74,5.96],[5.96,6.18],[6.18,6.86],null,[7.36,7.42],[7.42,7.74],[7.74,8.06],[8.06,8.54],[8.54,8.8],[8.8,8.94],[8.94,9.18],[9.18,9.62],[9.62,9.9],[9.9,10.2],[10.2,10.86],[10.86,10.9],[10.9,11.12],[11.12,11.7],null,[12.16,12.34],[12.34,12.7],[12.7,13.08],[13.08,13.44],[13.44,14.14],[14.86,15.1],[15.1,15.3],[15.3,15.58],[15.58,16.1],[16.1,16.64],[16.64,17.02],[17.02,17.3],[17.3,17.6],[17.6,18.1],[18.4,18.52],[18.52,18.98],[18.98,19.04],[19.04,19.26],[19.26,19.52],[19.52,19.8],[19.8,20.14],[20.14,20.52],[20.52,20.74],[20.74,20.92],[20.92,21.4],[21.92,22.16],[22.16,22.46],[22.46,22.64],[22.64,22.9],[22.9,23.32],[23.32,23.64],[23.64,24.04],null,[24.7,24.86],[24.86,25.1],[25.1,25.44],[25.44,25.92],[25.92,26.44],[26.44,26.68],[26.68,26.96],[26.96,27.46],[27.46,27.86],[27.86,28.16],[28.16,28.54],[28.54,28.58],[28.58,28.8],[28.8,29.04],[29.04,29.24],[29.24,29.44],[29.44,29.7],[30.14,30.32],[30.32,30.56],[30.56,30.84],[30.84,31.4],[31.4,32.12],[32.12,32.14],[32.14,32.36],[32.36,33.12],[33.12,33.17],[33.17,33.37],[33.37,33.62],[34.26,34.42],[34.42,34.78],[34.78,35.04],[35.04,35.28],[35.28,35.54],[35.54,35.8],[35.8,36.08],[36.08,36.46],[36.46,36.7],[36.7,37.2],[37.76,37.94],[37.94,38.2],[38.2,38.44],[38.44,38.88],[38.88,39.32],[39.32,39.72],[39.72,40.28],[40.28,40.68],[40.68,40.72],[40.72,40.94],[40.94,41.32],[41.32,41.88],[41.88,41.91],[41.91,42.2],[42.2,42.6],[42.6,42.82],[42.82,43.28],[43.92,44.1],[44.1,44.3],[44.3,44.74],[44.84,45.02],[45.02,45.26],[45.26,45.6],[45.6,45.84],[45.84,46.18],[46.18,46.44],[46.44,46.76],[46.76,47.28],[48.2,48.4],[48.4,48.76],[48.76,48.98],[48.98,49.3],[49.3,49.8],[49.8,50.08],[50.08,50.58],[50.58,51.28],[51.28,51.72],[51.72,52.06],[52.06,52.56],[52.56,52.8],[52.8,53.1],[53.1,53.6],[53.6,53.9],[53.9,54.26],[54.26,54.58],[54.58,55.14],[55.14,55.74],[55.74,56.08],[56.08,56.44],[56.44,56.76],[56.76,57.02],[57.02,57.32],[57.32,57.54],[57.54,57.8],[57.8,58.12],[58.12,58.54],[59.32,59.5],[59.5,60],[60,60.3],[60.3,60.76],[60.76,61],[61,61.52],[61.52,61.76],[61.76,62.16],[62.16,62.56],[63.26,63.56],[63.56,63.82],[63.82,64.2],[64.2,64.42],[64.42,64.88],[64.88,65.22],[65.22,65.46],[65.46,66.06],[66.34,66.6],[66.6,66.94],[66.94,67.34],[67.34,67.62],[67.62,67.83],[67.83,68.04],[68.04,68.1],[68.1,68.34],[68.72,69.24],[69.24,69.28],[69.28,69.48],[69.48,69.82],[69.82,70.14],[70.14,70.74],[70.74,71.24],[71.24,71.56],[71.56,71.98],[71.98,72.36],[72.36,72.54],[72.54,73.28],[73.76,74.08],null,[74.24,74.46],[74.46,75.24],[75.24,75.44],[75.44,75.64],[75.64,76.18],[76.18,76.62],[76.62,77.12],[77.12,77.74],[77.74,78.3],[78.3,78.52],[78.52,78.96],[78.96,79.86],[80.26,80.52],[80.52,81.26],[81.26,81.82],[81.82,81.98],[81.98,82.24],[82.24,82.96],[82.96,82.99],[82.99,83.2],[83.2,83.88],[83.88,84.7],[84.7,85.04],[85.04,85.28],[85.28,85.6],[85.6,85.88],[85.88,86.2],[86.2,86.52],[86.52,86.82],[86.82,87.06],[87.06,87.38],[87.84,88],[88,88.46],[88.46,88.74],[88.74,89.1],[89.1,89.4],[89.4,89.9],[89.9,90.34],[90.34,90.74],null,[91.64,91.79],[91.79,91.94],[91.94,92.24],[92.24,93.56],[93.56,93.6],[93.6,93.86],[93.86,94.56],[94.56,94.94],[94.94,95.32],[95.32,96.04],[96.48,96.72],[96.72,97.2],[97.2,97.72],[97.72,98.08],[98.08,98.48],null,[99.28,99.46],[99.46,99.82],[99.82,100.12],[100.12,100.42],[100.42,100.64],[100.64,100.9],[100.9,101.34],[101.34,101.78],[101.96,102.1],[102.1,102.42],[102.42,102.74],[102.74,103.1],[103.1,103.38],[103.38,103.72],[103.72,103.98],[103.98,104.44],[104.8,105],[105,105.26],[105.26,105.7],[105.7,105.76],[105.76,106.14],[106.14,106.44],[106.44,106.68],[106.68,106.94],[106.94,107.28],[107.28,107.96],[108.3,108.5],[108.5,108.7],[108.7,109.04],[109.04,109.56],[109.56,109.86],[109.86,110.08],[110.08,110.68],[110.68,111.18],[111.18,111.72],[111.72,112.12],[112.12,112.48],[112.48,113.14],[113.14,113.52],[113.52,113.66],[113.66,113.98],[114.92,114.98],[114.98,115.36],[115.36,115.7],[115.7,116],[116,116.48],[116.48,116.9],[116.9,117.38],[117.38,117.96],[118.4,118.56],[118.56,118.78],[118.78,118.96],[118.96,119.26],[119.26,119.56],[119.56,119.84],[119.84,120.26],[120.26,120.58],[120.58,121.04],[121.04,121.3],[121.3,121.64],[122.06,122.24],[122.24,122.52],[122.52,122.86],[122.86,123.08],[123.08,123.26],[123.26,123.58],[123.58,123.86],[123.86,124.06],[124.06,124.48],[124.48,124.68],[124.68,124.86],[124.86,125.22],[125.22,125.66]]
        },
        "title": "第三列",
        "theme": {
          "zh": "寻根之旅",
          "en": "An Archaeologist's Expedition"
        },
        "words": [
          {
            "id": "s3col3-chunk",
            "word": "chunk",
            "pos": "n.",
            "meaning": "大块；厚块"
          },
          {
            "id": "s3col3-ancestry",
            "word": "ancestry",
            "pos": "n.",
            "meaning": "祖先；血统"
          },
          {
            "id": "s3col3-autonomous",
            "word": "autonomous",
            "pos": "adj.",
            "meaning": "自治的；自主的"
          },
          {
            "id": "s3col3-detach",
            "word": "detach",
            "pos": "v.",
            "meaning": "分离；拆开；使脱离"
          },
          {
            "id": "s3col3-collision",
            "word": "collision",
            "pos": "n.",
            "meaning": "碰撞；冲突"
          },
          {
            "id": "s3col3-grip",
            "word": "grip",
            "pos": "n./v.",
            "meaning": "紧握；控制"
          },
          {
            "id": "s3col3-automobile",
            "word": "automobile",
            "pos": "n.",
            "meaning": "汽车"
          },
          {
            "id": "s3col3-conception",
            "word": "conception",
            "pos": "n.",
            "meaning": "构想；概念；受孕"
          },
          {
            "id": "s3col3-rein",
            "word": "rein",
            "pos": "n.",
            "meaning": "缰绳；控制权"
          },
          {
            "id": "s3col3-manifest",
            "word": "manifest",
            "pos": "v./adj.",
            "meaning": "显现；表明；明显的"
          },
          {
            "id": "s3col3-reproduction",
            "word": "reproduction",
            "pos": "n.",
            "meaning": "复制；再现；繁殖"
          },
          {
            "id": "s3col3-resilient",
            "word": "resilient",
            "pos": "adj.",
            "meaning": "有韧性的；能恢复的"
          },
          {
            "id": "s3col3-compatible",
            "word": "compatible",
            "pos": "adj.",
            "meaning": "兼容的；相容的"
          },
          {
            "id": "s3col3-speculate",
            "word": "speculate",
            "pos": "v.",
            "meaning": "推测；猜测；投机"
          },
          {
            "id": "s3col3-factual",
            "word": "factual",
            "pos": "adj.",
            "meaning": "事实的；基于事实的"
          },
          {
            "id": "s3col3-embark",
            "word": "embark",
            "pos": "v.",
            "meaning": "着手；从事；上船"
          },
          {
            "id": "s3col3-revive",
            "word": "revive",
            "pos": "v.",
            "meaning": "使复苏；使复兴"
          },
          {
            "id": "s3col3-burial",
            "word": "burial",
            "pos": "n.",
            "meaning": "埋葬；葬礼"
          },
          {
            "id": "s3col3-jeopardise",
            "word": "jeopardise",
            "pos": "v.",
            "meaning": "危及；损害"
          },
          {
            "id": "s3col3-repository",
            "word": "repository",
            "pos": "n.",
            "meaning": "贮藏室；储藏库"
          },
          {
            "id": "s3col3-reckon",
            "word": "reckon",
            "pos": "v.",
            "meaning": "估算；认为；想"
          },
          {
            "id": "s3col3-dedication",
            "word": "dedication",
            "pos": "n.",
            "meaning": "奉献；献身；专注"
          },
          {
            "id": "s3col3-notably",
            "word": "notably",
            "pos": "adv.",
            "meaning": "显著地；尤其"
          },
          {
            "id": "s3col3-circulate",
            "word": "circulate",
            "pos": "v.",
            "meaning": "流传；循环；散布"
          },
          {
            "id": "s3col3-incur",
            "word": "incur",
            "pos": "v.",
            "meaning": "招致；引起；承担"
          },
          {
            "id": "s3col3-deliberate",
            "word": "deliberate",
            "pos": "adj./v.",
            "meaning": "蓄意的；深思熟虑的"
          },
          {
            "id": "s3col3-compulsory",
            "word": "compulsory",
            "pos": "adj.",
            "meaning": "强制的；必修的；义务的"
          },
          {
            "id": "s3col3-drift",
            "word": "drift",
            "pos": "v./n.",
            "meaning": "漂流；漂移；飘动"
          },
          {
            "id": "s3col3-rigour",
            "word": "rigour",
            "pos": "n.",
            "meaning": "严格；严密；严酷"
          },
          {
            "id": "s3col3-haul",
            "word": "haul",
            "pos": "n./v.",
            "meaning": "拖拉；搬运；长途运输"
          },
          {
            "id": "s3col3-nominate",
            "word": "nominate",
            "pos": "v.",
            "meaning": "提名；任命"
          },
          {
            "id": "s3col3-violation",
            "word": "violation",
            "pos": "n.",
            "meaning": "违反；违背；侵犯"
          },
          {
            "id": "s3col3-fraud",
            "word": "fraud",
            "pos": "n.",
            "meaning": "欺诈；骗局；骗子"
          },
          {
            "id": "s3col3-slack",
            "word": "slack",
            "pos": "adj.",
            "meaning": "松弛的；懈怠的；马虎的"
          },
          {
            "id": "s3col3-descendant",
            "word": "descendant",
            "pos": "n.",
            "meaning": "后代；后裔"
          },
          {
            "id": "s3col3-aisle",
            "word": "aisle",
            "pos": "n.",
            "meaning": "过道；通道；走廊"
          }
        ],
        "paragraphs": [
          {
            "id": "s3col3-p1",
            "segments": [
              "Dr. Elena Voss decided to ",
              {
                "vocabId": "s3col3-embark",
                "text": "embark"
              },
              " on an expedition to trace her ",
              {
                "vocabId": "s3col3-ancestry",
                "text": "ancestry"
              },
              ", hoping to uncover evidence of the ancient people from whom she, a proud ",
              {
                "vocabId": "s3col3-descendant",
                "text": "descendant"
              },
              ", had inherited her restless curiosity. As the only ",
              {
                "vocabId": "s3col3-autonomous",
                "text": "autonomous"
              },
              " researcher funded by her institute, she kept a firm ",
              {
                "vocabId": "s3col3-rein",
                "text": "rein"
              },
              " on every detail of the project, refusing to let her standards grow ",
              {
                "vocabId": "s3col3-slack",
                "text": "slack"
              },
              "."
            ],
            "analysis": {
              "translation": "埃琳娜·沃斯博士决定踏上一段探险之旅，去追溯她的血脉，希望能找到关于那个古老民族的证据——她作为一个自豪的后裔，正是从他们那里继承了那份永不餍足的好奇心。作为研究所资助的唯一一位独立研究者，她对项目的每一个细节都严加掌控，拒绝让自己的标准有所松懈。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “埃琳娜·沃斯博士决定踏上一段探险之旅，去追溯她的血…” → “作为研究所资助的唯一一位独立研究者，她对项目的每一…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 Dr. Elena Voss decided to embark on an expedition,<span class=\"keyword\">embark on</span> 意为“着手、踏上”。",
                "<span class=\"keyword\">结构拆解</span>：to trace her ancestry 是<span class=\"keyword\">不定式作目的状语</span>,说明探险目的。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：hoping to uncover evidence of the ancient people 是<span class=\"keyword\">现在分词短语作伴随状语</span>,表伴随的希望。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：from whom she, a proud descendant, had inherited her restless curiosity 是<span class=\"keyword\">定语从句</span>修饰 the ancient people,from whom 作 inherited 的状语，中间 a proud descendant 为<span class=\"keyword\">插入同位语</span>。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：As the only autonomous researcher funded by her institute 是<span class=\"keyword\">介词 As 短语作状语</span>表身份，funded by... 为过去分词短语作后置定语。",
                "<span class=\"keyword\">地道表达</span>：she kept a firm rein on every detail 中 <span class=\"keyword\">keep a firm rein on</span> 意为“对……严加掌控”。",
                "<span class=\"keyword\">结构拆解</span>：refusing to let her standards grow slack 是<span class=\"keyword\">现在分词短语作伴随状语</span>,<span class=\"keyword\">grow slack</span> 意为“变得松懈”。",
                "<span class=\"keyword\">语境搭配</span>：embark 出现在“decided to embark on an expedition”中，本段取“着手”义；ancestry 出现在“trace her ancestry”中，本段取“祖先”义；descendant 出现在“a proud descendant”中，本段取“后代”义；autonomous 出现在“the only autonomous researcher funded by”中，本段取“自治的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col3-p2",
            "segments": [
              "She drove her ",
              {
                "vocabId": "s3col3-automobile",
                "text": "automobile"
              },
              " across the desert, her hands locked in a tight ",
              {
                "vocabId": "s3col3-grip",
                "text": "grip"
              },
              " on the wheel as the vehicle narrowly avoided a ",
              {
                "vocabId": "s3col3-collision",
                "text": "collision"
              },
              " with a fallen boulder. The ",
              {
                "vocabId": "s3col3-conception",
                "text": "conception"
              },
              " of this journey had taken years to mature, rooted in her ",
              {
                "vocabId": "s3col3-dedication",
                "text": "dedication"
              },
              " to scholarly ",
              {
                "vocabId": "s3col3-rigour",
                "text": "rigour"
              },
              " and a desire to ",
              {
                "vocabId": "s3col3-revive",
                "text": "revive"
              },
              " a forgotten chapter of history."
            ],
            "analysis": {
              "translation": "她驾驶着汽车穿越沙漠，双手紧紧攥住方向盘，而车子险些与一块坠落的巨石相撞。这段旅程的构想历经数年才得以成熟，根植于她对学术严谨的执着，以及复活一段被遗忘的历史篇章的渴望。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她驾驶着汽车穿越沙漠，双手紧紧攥住方向盘，而车子险…” → “这段旅程的构想历经数年才得以成熟，根植于她对学术严…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 She drove her automobile across the desert,her hands locked in a tight grip on the wheel 是<span class=\"keyword\">独立主格结构</span>,名词 + 过去分词短语，作伴随状语。",
                "<span class=\"keyword\">结构拆解</span>：as the vehicle narrowly avoided a collision with a fallen boulder 是<span class=\"keyword\">时间/方式状语从句</span>,as 意为“当……时”,<span class=\"keyword\">narrowly avoid</span> 意为“险些未能避免、勉强避开”。这里不是在补充事实，而是用类比或假设呈现人物感受，让画面和语气更鲜明。",
                "<span class=\"keyword\">句子骨架</span>：The conception of this journey had taken years to mature 为主谓宾结构，<span class=\"keyword\">take time to do sth</span> 表示“花(时间)做某事”。",
                "<span class=\"keyword\">结构拆解</span>：rooted in her dedication to scholarly rigour and a desire to revive a forgotten chapter of history 是<span class=\"keyword\">过去分词短语作后置定语</span>修饰 conception(或作伴随状语)。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">rooted in</span> 意为“根植于”,后接两个并列宾语 dedication 与 desire。",
                "<span class=\"keyword\">结构拆解</span>：to revive a forgotten chapter of history 是<span class=\"keyword\">不定式作后置定语</span>修饰 desire,<span class=\"keyword\">revive</span> 意为“复活、重振”。",
                "<span class=\"keyword\">语境搭配</span>：automobile 出现在“drove her automobile across the desert”中，本段取“汽车”义；grip 出现在“a tight grip on the wheel”中，本段取“紧握”义；collision 出现在“avoided a collision with a fallen”中，本段取“碰撞”义；conception 出现在“The conception of this journey”中，本段取“构想”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col3-p3",
            "segments": [
              "At the site, her team began the long ",
              {
                "vocabId": "s3col3-haul",
                "text": "haul"
              },
              " of excavation. Elena had to ",
              {
                "vocabId": "s3col3-detach",
                "text": "detach"
              },
              " herself from wishful expectations and examine every ",
              {
                "vocabId": "s3col3-chunk",
                "text": "chunk"
              },
              " of compacted soil with ",
              {
                "vocabId": "s3col3-deliberate",
                "text": "deliberate"
              },
              " care. It was ",
              {
                "vocabId": "s3col3-compulsory",
                "text": "compulsory"
              },
              " for each worker to log every finding; any ",
              {
                "vocabId": "s3col3-violation",
                "text": "violation"
              },
              " of protocol could ",
              {
                "vocabId": "s3col3-jeopardise",
                "text": "jeopardise"
              },
              " the entire dig. Rumours soon began to ",
              {
                "vocabId": "s3col3-circulate",
                "text": "circulate"
              },
              " among the crew—some would ",
              {
                "vocabId": "s3col3-speculate",
                "text": "speculate"
              },
              " that the tomb was a hoax, even a ",
              {
                "vocabId": "s3col3-fraud",
                "text": "fraud"
              },
              "—but Elena insisted on ",
              {
                "vocabId": "s3col3-factual",
                "text": "factual"
              },
              " evidence rather than hearsay."
            ],
            "analysis": {
              "translation": "在遗址现场，她的团队开始了漫长的挖掘工作。埃琳娜不得不让自己脱离一厢情愿的期待，以审慎的态度审视每一块压实的土块。每位工人都必须记录每一项发现；任何对规程的违反都可能危及整个挖掘。谣言很快在队员间流传开来——有人揣测这座墓穴是个骗局，甚至是一场欺诈——但埃琳娜坚持要事实证据，而非道听途说。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在遗址现场，她的团队开始了漫长的挖掘工作” → “每位工人都必须记录每一项发现” → “谣言很快在队员间流传开来——有人揣测这座墓穴是个骗…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 her team began the long haul of excavation,<span class=\"keyword\">the long haul</span> 意为“漫长的艰苦过程”。",
                "<span class=\"keyword\">地道表达</span>：Elena had to detach herself from wishful expectations 中 <span class=\"keyword\">detach oneself from</span> 表示“使自己脱离……”,wishful 意为“一厢情愿的”。",
                "<span class=\"keyword\">逻辑衔接</span>：and examine every chunk of compacted soil with deliberate care 与 detach 并列作 had to 的宾语，with deliberate care 为方式状语。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：It was compulsory for each worker to log every finding 中 It 为形式主语，<span class=\"keyword\">It is compulsory for sb to do sth</span> 表示“某人必须做某事”。",
                "<span class=\"keyword\">地道表达</span>：any violation of protocol could jeopardise the entire dig 中 <span class=\"keyword\">jeopardise</span> 意为“危及”,violation of protocol 为主语。",
                "<span class=\"keyword\">句子骨架</span>：Rumours soon began to circulate among the crew 为主谓结构，破折号间 some would speculate that... 是<span class=\"keyword\">解释性插入句</span>,that 引导宾语从句作 speculate 的宾语。",
                "<span class=\"keyword\">地道表达</span>：but Elena insisted on factual evidence rather than hearsay 表转折，<span class=\"keyword\">insist on</span> 表示“坚持要”,<span class=\"keyword\">rather than</span> 连接对比成分 hearsay(道听途说)。",
                "<span class=\"keyword\">语境搭配</span>：haul 出现在“the long haul of excavation”中，本段取“拖拉”义；detach 出现在“had to detach herself from wishful”中，本段取“分离”义；chunk 出现在“examine every chunk of compacted soil”中，本段取“大块”义；deliberate 出现在“soil with deliberate care”中，本段取“蓄意的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col3-p4",
            "segments": [
              "\n",
              {
                "vocabId": "s3col3-notably",
                "text": "Notably"
              },
              ", the team's methods proved ",
              {
                "vocabId": "s3col3-compatible",
                "text": "compatible"
              },
              " with international standards, and the ",
              {
                "vocabId": "s3col3-resilient",
                "text": "resilient"
              },
              " archaeologists weathered sandstorms that would have undone a lesser expedition. When they cleared the narrow ",
              {
                "vocabId": "s3col3-aisle",
                "text": "aisle"
              },
              " leading into the chamber, the significance of their discovery began to ",
              {
                "vocabId": "s3col3-manifest",
                "text": "manifest"
              },
              ": rows of clay tablets, a buried ",
              {
                "vocabId": "s3col3-repository",
                "text": "repository"
              },
              " of ancient knowledge, preserved through centuries of ",
              {
                "vocabId": "s3col3-burial",
                "text": "burial"
              },
              ". Elena could only ",
              {
                "vocabId": "s3col3-reckon",
                "text": "reckon"
              },
              " that her ancestors had hidden this archive on purpose to protect it."
            ],
            "analysis": {
              "translation": "值得注意的是，该团队的方法被证明与国际标准相兼容，而坚韧的考古学家们经受住了足以摧毁任何较小规模考察队的沙尘暴。当他们清理出通向墓室的狭窄过道时，他们发现的意义开始显现：一排排泥板，一座被掩埋的古代知识宝库，历经数百年的掩埋得以保存。埃琳娜只能推测，她的祖先是有意将这座档案库藏匿于此，以保护它。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “值得注意的是，该团队的方法被证明与国际标准相兼容，…” → “当他们清理出通向墓室的狭窄过道时，他们发现的意义开…” → “埃琳娜只能推测，她的祖先是有意将这座档案库藏匿于此…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：该句为并列复合句，由and连接两个并列分句，主干为\"the team's methods proved compatible... and the resilient archaeologists weathered sandstorms\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that would have undone a lesser expedition 修饰sandstorms，that在从句中作主语，使用虚拟语气would have done表示对过去的假设。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">weather</span> 经受住、渡过（风雨、困难等），此处作动词用，weathered sandstorms 意为“经受住了沙尘暴”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：When they cleared the narrow aisle leading into the chamber，由When引导，表示“当他们清理出……时”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语leading into the chamber作后置定语，修饰aisle，表示“通向墓室的过道”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">reckon</span> 认为、推测，后接that引导的宾语从句 that her ancestors had hidden this archive on purpose to protect it。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：过去分词短语preserved through centuries of burial作后置定语，修饰repository，表示“历经数百年掩埋而保存下来的”。",
                "<span class=\"keyword\">语境搭配</span>：Notably 出现在“Notably”中，本段取“显著地”义；compatible 出现在“methods proved compatible with international standards”中，本段取“兼容的”义；resilient 出现在“and the resilient archaeologists weathered sandstorms”中，本段取“有韧性的”义；aisle 出现在“the narrow aisle leading into the”中，本段取“过道”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col3-p5",
            "segments": [
              "The team would later ",
              {
                "vocabId": "s3col3-nominate",
                "text": "nominate"
              },
              " the site for heritage protection, and the careful ",
              {
                "vocabId": "s3col3-reproduction",
                "text": "reproduction"
              },
              " of the tablets' inscriptions would allow scholars worldwide to study them. Elena knew the expedition might ",
              {
                "vocabId": "s3col3-incur",
                "text": "incur"
              },
              " enormous costs, yet as she watched the evening wind ",
              {
                "vocabId": "s3col3-drift",
                "text": "drift"
              },
              " across the dunes, she felt certain that her journey had honored those who came before her."
            ],
            "analysis": {
              "translation": "团队后来将该遗址提名申请遗产保护，而对泥板铭文的精心复制将使世界各地的学者得以研究它们。埃琳娜知道这次考察可能会耗费巨额资金，然而当她望着晚风吹过沙丘时，她确信自己的旅程已经告慰了那些先辈。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “团队后来将该遗址提名申请遗产保护，而对泥板铭文的精…” → “埃琳娜知道这次考察可能会耗费巨额资金，然而当她望着…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：该句由and连接两个并列分句，主干为\"The team would later nominate the site... and the careful reproduction... would allow scholars... to study them\"。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">nominate... for...</span> 提名……参选……，此处指为遗产保护提名该遗址。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">allow sb. to do sth.</span> 允许某人做某事，allow scholars worldwide to study them 为该结构。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：Elena knew (that) the expedition might incur enormous costs，省略了that的宾语从句。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">incur</span> 招致、引起，incur enormous costs 意为“耗费巨额资金”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：as she watched the evening wind drift across the dunes，由as引导，表示“当她看着……时”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that her journey had honored those who came before her 作felt certain的宾语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：who came before her 修饰those，指“在她之前到来的人（先辈）”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：nominate 出现在“would later nominate the site for”中，本段取“提名”义；reproduction 出现在“the careful reproduction of the tablets'”中，本段取“复制”义；incur 出现在“expedition might incur enormous costs”中，本段取“招致”义；drift 出现在“evening wind drift across the dunes”中，本段取“漂流”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s3col4",
        "number": 4,
        "audio": {
          "src": "audio/list3_col4.mp3",
          "cues": [[2.7,2.85],[2.85,3],[3,3.32],[3.32,3.58],[3.58,4.04],[4.04,4.26],[4.26,4.58],[4.58,4.64],[4.64,4.86],[4.86,5],[5,5.16],[5.16,5.62],[5.62,6.02],[6.02,6.4],[6.4,6.96],[6.96,7.38],[7.38,7.82],[7.82,8.28],[8.28,8.94],[8.94,9.42],[9.42,9.66],[9.66,9.9],[9.9,10.46],[10.98,11.26],[11.26,11.56],[11.56,11.9],[12.26,12.4],[12.4,12.76],[12.76,13.08],[13.08,13.28],[13.28,13.56],[13.56,13.9],[13.9,14.18],[14.18,14.36],[14.36,14.54],[14.54,14.88],[15.32,15.44],[15.44,15.66],[15.66,15.84],[15.84,16.04],[16.04,16.54],[16.54,16.82],[16.82,17.1],[17.1,17.34],[17.34,17.6],[17.6,18.02],[18.02,18.52],[19.16,19.32],[19.32,19.8],[20.16,20.35],[20.35,20.54],[21.26,21.46],[21.46,21.86],[21.86,22.4],[22.4,23.96],[23.96,24],[24,24.22],[24.22,24.5],[24.5,24.92],[24.92,25.42],[25.42,25.78],[25.78,26.24],[26.24,26.64],[26.64,26.84],[26.84,27.32],[27.32,27.36],[27.36,27.74],[27.74,28.04],[28.04,28.42],[28.42,28.96],[28.96,29.7],[29.7,30.3],[30.3,30.8],[30.8,31.16],[31.16,31.46],[31.46,32.1],[32.62,32.88],[32.88,33.3],[33.42,33.58],[33.58,34.06],[34.06,34.52],[34.52,35.08],[35.08,35.52],[35.52,36.14],[36.14,36.57],[36.57,37],[37,37.36],[37.36,37.82],[37.82,38.32],[38.32,38.62],[38.62,38.94],[38.94,39.3],[39.3,39.78],null,[40.28,40.58],[40.58,40.88],[40.88,41.6],[41.6,41.77],[41.77,41.94],[41.94,42.32],[42.32,42.7],[42.7,43.06],[43.06,43.5],[43.5,43.84],null,[43.84,44.46],[44.46,44.9],[45.3,45.42],[45.42,45.72],[45.98,46.16],[46.16,46.4],[46.4,46.66],[46.66,47.08],[47.08,47.6],[48.2,48.42],[48.42,48.74],[48.74,49.14],[49.14,49.44],[49.44,49.68],[49.68,49.92],[49.92,50.26],[50.26,50.66],[50.66,51],[51,51.24],[51.24,51.6],[51.9,52.1],[52.1,52.42],[52.42,53.04],[53.04,53.36],[53.36,53.72],[53.72,54.06],[54.06,54.44],[54.44,54.76],[54.76,55.08],[55.08,55.6],[55.6,55.76],[55.76,55.92],[55.92,56.18],[56.18,56.54],[56.54,56.96],[56.96,57.58],[57.58,57.94],[57.94,58.16],[58.16,58.42],[58.42,58.9],[58.9,59.6],null,[60.34,61.04],[61.04,61.42],[61.42,61.8],[61.8,62.38],null,[62.8,63],[63,63.24],[63.24,63.56],[63.56,64.14],[64.14,64.62],[64.62,64.96],[64.96,65.34],[65.34,65.64],[65.64,65.92],[65.92,66.32],[66.32,66.58],[66.58,66.96],[66.96,67.3],[67.3,67.56],[68.24,68.42],[68.42,68.78],[68.78,69.04],[69.04,69.5],[69.5,69.94],[69.94,70.48],[70.48,70.92],[70.92,71.26],[71.26,71.48],[71.48,71.86],[71.86,72.64],[72.64,72.89],[72.89,73.14],[73.14,73.36],[73.36,73.54],[73.54,73.72],[73.72,74.1],[74.1,74.4],[74.4,74.66],[74.66,74.96],[74.96,75.44],[75.92,76.24],[76.24,76.72],[77.22,77.38],[77.38,77.72],[77.72,78.08],[78.46,78.56],[78.56,78.8],[78.8,78.98],[78.98,79.34],[79.34,79.56],[79.56,79.88],[79.88,80.28],[80.28,80.7],[80.7,81.02],[81.02,81.38],[81.38,81.84],[81.84,82.16],[82.16,82.62],[82.62,82.87],[82.87,83.12],[83.12,83.8],[83.8,84.64],[84.64,85],[85,85.24],[85.24,85.7],[85.7,86],[86,86.28],[86.28,86.66],[86.66,87.14],[87.48,87.66],[87.66,87.88],[87.88,88.3],[88.3,88.54],[88.54,88.8],[88.8,89.14],[89.14,89.4],[89.4,89.62],[89.62,90.08],[90.86,90.98],[90.98,91.26],[91.26,91.54],[91.96,92.08],[92.08,92.56],[92.76,93],[93,93.44],[93.44,94.04],[94.04,94.08],[94.08,94.34],[94.34,94.74],[95.26,95.44],[95.44,95.84],[95.84,95.98],[95.98,96.38],[96.38,96.92],[96.92,96.95],[96.95,97.3],[97.3,97.88],[97.88,98.14],[98.14,98.44],[98.44,98.82],[99.16,99.38],[99.38,99.66],[99.66,99.94],[99.94,100.14],[100.14,100.42],[100.42,101.08],[101.78,102.06],[102.06,102.34],[102.34,102.76],[102.96,103.08],[103.08,103.4],[103.4,103.68],[103.96,104.08],[104.08,104.4],[104.4,104.7],[104.7,105.06],[105.06,105.36],[105.68,105.88],[105.88,106.1],[106.1,106.26],[106.26,106.54],[106.54,106.74],[106.74,107.14],[107.14,107.16],[107.16,107.38],[107.38,107.96],[107.96,108.82],[108.82,109.08],[109.08,109.54],[109.54,109.88],[109.88,110.32],[110.32,110.7],[110.7,111],[111,111.38],[111.8,111.88],[111.88,112.46],[112.64,112.82],[112.82,113.24],[113.24,113.64],[113.64,114.12],[114.12,114.44],[114.44,114.78],[115.18,115.26],[115.26,115.64],[115.64,115.98],[115.98,116.46],[116.46,116.74],[117.24,118.2],[118.2,118.52],[118.52,118.8],[118.8,119.38],[119.38,119.78],[119.78,119.94],[119.94,120.26],[120.68,120.74],[120.74,121],[121,121.32],[121.68,121.84],[121.84,122.14],[122.14,122.54],[122.74,123],[123,123.42]]
        },
        "title": "第四列",
        "theme": {
          "zh": "冰川危途",
          "en": "A Village Transcends Its Fate"
        },
        "words": [
          {
            "id": "s3col4-paralysed",
            "word": "paralysed",
            "pos": "adj.",
            "meaning": "瘫痪的；麻痹的"
          },
          {
            "id": "s3col4-tide",
            "word": "tide",
            "pos": "n.",
            "meaning": "潮汐；潮流；浪潮"
          },
          {
            "id": "s3col4-tenure",
            "word": "tenure",
            "pos": "n.",
            "meaning": "占有权；保有期；任期"
          },
          {
            "id": "s3col4-cottage",
            "word": "cottage",
            "pos": "n.",
            "meaning": "村舍；小屋"
          },
          {
            "id": "s3col4-suspicion",
            "word": "suspicion",
            "pos": "n.",
            "meaning": "怀疑；嫌疑"
          },
          {
            "id": "s3col4-glacier",
            "word": "glacier",
            "pos": "n.",
            "meaning": "冰川；冰河"
          },
          {
            "id": "s3col4-spectacle",
            "word": "spectacle",
            "pos": "n.",
            "meaning": "壮观的景象；奇观"
          },
          {
            "id": "s3col4-notorious",
            "word": "notorious",
            "pos": "adj.",
            "meaning": "臭名昭著的；声名狼藉的"
          },
          {
            "id": "s3col4-sole",
            "word": "sole",
            "pos": "adj.",
            "meaning": "唯一的；仅有的"
          },
          {
            "id": "s3col4-transcend",
            "word": "transcend",
            "pos": "v.",
            "meaning": "超越；超出"
          },
          {
            "id": "s3col4-moan",
            "word": "moan",
            "pos": "n./v.",
            "meaning": "呻吟（声）；抱怨"
          },
          {
            "id": "s3col4-oblige",
            "word": "oblige",
            "pos": "v.",
            "meaning": "迫使；责成；帮忙效劳"
          },
          {
            "id": "s3col4-tedious",
            "word": "tedious",
            "pos": "adj.",
            "meaning": "乏味的；单调沉闷的"
          },
          {
            "id": "s3col4-hazardous",
            "word": "hazardous",
            "pos": "adj.",
            "meaning": "危险的；冒险的"
          },
          {
            "id": "s3col4-leverage",
            "word": "leverage",
            "pos": "v./n.",
            "meaning": "利用；杠杆作用；影响力"
          },
          {
            "id": "s3col4-blend",
            "word": "blend",
            "pos": "v./n.",
            "meaning": "混合；融合；混合物"
          },
          {
            "id": "s3col4-iconic",
            "word": "iconic",
            "pos": "adj.",
            "meaning": "标志性的；图标的"
          },
          {
            "id": "s3col4-rebel",
            "word": "rebel",
            "pos": "v./n.",
            "meaning": "反抗；叛离；反抗者"
          },
          {
            "id": "s3col4-susceptible",
            "word": "susceptible",
            "pos": "adj.",
            "meaning": "易受影响的；易感染的"
          },
          {
            "id": "s3col4-contradict",
            "word": "contradict",
            "pos": "v.",
            "meaning": "反驳；与……相矛盾"
          },
          {
            "id": "s3col4-stigma",
            "word": "stigma",
            "pos": "n.",
            "meaning": "耻辱；污名"
          },
          {
            "id": "s3col4-plague",
            "word": "plague",
            "pos": "n./v.",
            "meaning": "瘟疫；虫害；折磨"
          },
          {
            "id": "s3col4-saturated",
            "word": "saturated",
            "pos": "adj.",
            "meaning": "饱和的；浸透的"
          },
          {
            "id": "s3col4-compact",
            "word": "compact",
            "pos": "adj.",
            "meaning": "紧凑的；简洁的"
          },
          {
            "id": "s3col4-pesticide",
            "word": "pesticide",
            "pos": "n.",
            "meaning": "杀虫剂；农药"
          },
          {
            "id": "s3col4-rationality",
            "word": "rationality",
            "pos": "n.",
            "meaning": "理性；合理性"
          },
          {
            "id": "s3col4-implicit",
            "word": "implicit",
            "pos": "adj.",
            "meaning": "含蓄的；暗含的"
          },
          {
            "id": "s3col4-immense",
            "word": "immense",
            "pos": "adj.",
            "meaning": "巨大的；广大的"
          },
          {
            "id": "s3col4-aggregate",
            "word": "aggregate",
            "pos": "n./adj.",
            "meaning": "总计；聚集物；合计的"
          },
          {
            "id": "s3col4-therapeutic",
            "word": "therapeutic",
            "pos": "adj.",
            "meaning": "治疗的；有疗效的"
          },
          {
            "id": "s3col4-stance",
            "word": "stance",
            "pos": "n.",
            "meaning": "立场；姿态"
          },
          {
            "id": "s3col4-shatter",
            "word": "shatter",
            "pos": "v.",
            "meaning": "粉碎；砸碎；使破灭"
          },
          {
            "id": "s3col4-scattered",
            "word": "scattered",
            "pos": "adj.",
            "meaning": "散落的；分散的"
          }
        ],
        "paragraphs": [
          {
            "id": "s3col4-p1",
            "segments": [
              "The ",
              {
                "vocabId": "s3col4-cottage",
                "text": "cottage"
              },
              " village of Aelvik huddled at the foot of an ",
              {
                "vocabId": "s3col4-iconic",
                "text": "iconic"
              },
              "\n",
              {
                "vocabId": "s3col4-glacier",
                "text": "glacier"
              },
              " whose meltwater, season after season, carved the valley's ",
              {
                "vocabId": "s3col4-sole",
                "text": "sole"
              },
              " road. Remote and proud, the settlement clung to this harsh corner of the world as though the ice itself had granted it permission to exist. For generations the villagers' quiet ",
              {
                "vocabId": "s3col4-tenure",
                "text": "tenure"
              },
              " felt unshakeable—until a ",
              {
                "vocabId": "s3col4-plague",
                "text": "plague"
              },
              " of invasive bark beetles drifted in on the warming ",
              {
                "vocabId": "s3col4-tide",
                "text": "tide"
              },
              " of glacial runoff, ",
              {
                "vocabId": "s3col4-scattered",
                "text": "scattered"
              },
              " across every slope and crevice."
            ],
            "analysis": {
              "translation": "埃尔维克的村落小屋紧挨着一座标志性冰川的山脚下，冰川融水年复一年地冲蚀出山谷中唯一的一条路。这个偏远而骄傲的聚落依附在这片严酷的角落，仿佛是冰川本身赋予了它存在的许可。几代人的时间里，村民们宁静的栖居看似不可动摇——直到一群入侵的小蠹虫随着冰川融水变暖的潮水漂入，散布到了每一个山坡和缝隙之中。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “埃尔维克的村落小屋紧挨着一座标志性冰川的山脚下，冰…” → “这个偏远而骄傲的聚落依附在这片严酷的角落，仿佛是冰…” → “几代人的时间里，村民们宁静的栖居看似不可动摇——直…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The cottage village of Aelvik huddled at the foot of an iconic glacier\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：whose meltwater... carved the valley's sole road 修饰glacier，whose作定语表示“冰川的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">方式状语从句</span>：as though the ice itself had granted it permission to exist，由as though引导，表示“仿佛……”，使用过去完成时表虚拟。这里不是在补充事实，而是用类比或假设呈现人物感受，让画面和语气更鲜明。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">huddle</span> 蜷缩、挤作一团，此处拟人化描写村落依偎在山脚。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">cling to</span> 紧紧依附、坚守，cling to this harsh corner 表示“依附在这片严酷的角落”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：until a plague of invasive bark beetles drifted in...，由until引导，表示“直到……为止”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：过去分词短语scattered across every slope and crevice作伴随状语，修饰bark beetles，表示“散布于每个山坡和缝隙”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">a plague of</span> 一大群、一场灾祸，修饰入侵害虫的数量之巨。",
                "<span class=\"keyword\">语境搭配</span>：cottage 出现在“The cottage village of Aelvik”中，本段取“村舍”义；iconic 出现在“of an iconic glacier whose meltwater”中，本段取“标志性的”义；glacier 出现在“an iconic glacier whose meltwater”中，本段取“冰川”义；sole 出现在“the valley's sole road”中，本段取“唯一的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col4-p2",
            "segments": [
              "Within months the infestation grew ",
              {
                "vocabId": "s3col4-notorious",
                "text": "notorious"
              },
              " throughout the highlands. The insects proved ",
              {
                "vocabId": "s3col4-susceptible",
                "text": "susceptible"
              },
              " to only one ",
              {
                "vocabId": "s3col4-pesticide",
                "text": "pesticide"
              },
              ", yet spraying the ",
              {
                "vocabId": "s3col4-saturated",
                "text": "saturated"
              },
              " wetlands was both ",
              {
                "vocabId": "s3col4-tedious",
                "text": "tedious"
              },
              " and ",
              {
                "vocabId": "s3col4-hazardous",
                "text": "hazardous"
              },
              ", demanding masks, long hoses, and days of exhausting labor. Dead timber soon piled into an ",
              {
                "vocabId": "s3col4-immense",
                "text": "immense"
              },
              "\n",
              {
                "vocabId": "s3col4-aggregate",
                "text": "aggregate"
              },
              " of brittle wood, and each wind-borne ",
              {
                "vocabId": "s3col4-moan",
                "text": "moan"
              },
              " through hollow trunks sounded like the forest drawing its last breath. Fear left the village council ",
              {
                "vocabId": "s3col4-paralysed",
                "text": "paralysed"
              },
              "; ",
              {
                "vocabId": "s3col4-rationality",
                "text": "rationality"
              },
              " crumbled into ",
              {
                "vocabId": "s3col4-suspicion",
                "text": "suspicion"
              },
              ", and an ",
              {
                "vocabId": "s3col4-implicit",
                "text": "implicit"
              },
              "\n",
              {
                "vocabId": "s3col4-stigma",
                "text": "stigma"
              },
              " settled on anyone who dared whisper of abandoning the valley."
            ],
            "analysis": {
              "translation": "几个月内，虫害在高地一带变得臭名昭著。这些昆虫只对一种杀虫剂敏感，然而在饱和的湿地上喷洒既繁琐又危险，需要口罩、长水管和数日令人筋疲力尽的劳作。枯死木材很快堆积成一大堆脆弱的木头，风吹过空心树干发出的每一声呜咽都像是森林在咽下最后一口气。恐惧让村委会陷入瘫痪；理性崩塌为猜疑，一种隐性的耻辱感落在任何敢于低声议论放弃山谷的人身上。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “几个月内，虫害在高地一带变得臭名昭著” → “枯死木材很快堆积成一大堆脆弱的木头，风吹过空心树干…” → “恐惧让村委会陷入瘫痪” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"the infestation grew notorious throughout the highlands\"，grew为系动词后接形容词作表语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">susceptible to</span> 对……敏感的、易受……影响的，susceptible to only one pesticide 表示“仅对一种杀虫剂敏感”。",
                "<span class=\"keyword\">语境辨析</span>：动名词短语spraying the saturated wetlands作主语，was为系动词，both tedious and hazardous作表语。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语demanding masks, long hoses, and days of exhausting labor作伴随状语，补充说明喷洒工作的要求。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">pile into</span> 堆积成，piled into an immense aggregate of brittle wood 表示“堆积成一大堆脆弱木材”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">leave sb. + 过去分词</span>：Fear left the village council paralysed，leave后接复合宾语，paralysed作宾语补足语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：who dared whisper of abandoning the valley 修饰anyone，who作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">stigma</span> 耻辱、污名，an implicit stigma 意为“一种隐性的耻辱感”。",
                "<span class=\"keyword\">语境搭配</span>：notorious 出现在“infestation grew notorious throughout the highlands”中，本段取“臭名昭著的”义；susceptible 出现在“insects proved susceptible to only one”中，本段取“易受影响的”义；pesticide 出现在“only one pesticide”中，本段取“杀虫剂”义；saturated 出现在“spraying the saturated wetlands was both”中，本段取“饱和的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col4-p3",
            "segments": [
              "Yet the ",
              {
                "vocabId": "s3col4-spectacle",
                "text": "spectacle"
              },
              " of collapsing pines began to ",
              {
                "vocabId": "s3col4-contradict",
                "text": "contradict"
              },
              " the elders' stubborn ",
              {
                "vocabId": "s3col4-stance",
                "text": "stance"
              },
              " that the mountain would always shelter its own. Younger villagers, restless and grieving, wanted to ",
              {
                "vocabId": "s3col4-rebel",
                "text": "rebel"
              },
              "—to ",
              {
                "vocabId": "s3col4-shatter",
                "text": "shatter"
              },
              " old customs and ",
              {
                "vocabId": "s3col4-leverage",
                "text": "leverage"
              },
              " modern science before the beetles consumed everything. But tradition would ",
              {
                "vocabId": "s3col4-oblige",
                "text": "oblige"
              },
              " no such easy surrender, and the quarrels grew bitter enough to split families."
            ],
            "analysis": {
              "translation": "然而松树倒塌的景象开始与长老们固执的立场相矛盾——他们认为大山总会庇护自己的子民。年轻村民焦躁而悲伤，想要反叛——在甲虫吞噬一切之前打破旧习俗、借助现代科学的力量。但传统不允许如此轻易的屈服，争吵变得激烈到足以让家庭分裂。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “松树倒塌的景象开始与长老们固执的立场相矛盾——他们…” → “年轻村民焦躁而悲伤，想要反叛——在甲虫吞噬一切之前…” → “传统不允许如此轻易的屈服，争吵变得激烈到足以让家庭…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"the spectacle of collapsing pines began to contradict the elders' stubborn stance\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">同位语从句</span>：that the mountain would always shelter its own 作stance的同位语，解释说明立场的具体内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">contradict</span> 与……矛盾、反驳，began to contradict 表示“开始反驳/相矛盾”。",
                "<span class=\"keyword\">结构拆解</span>：形容词短语restless and grieving作插入语/后置定语，修饰younger villagers，表示“焦躁而悲伤的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后to shatter old customs and leverage modern science为不定式短语，对rebel进行解释说明。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：before the beetles consumed everything，由before引导。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">oblige</span> 迫使、责成，oblige no such easy surrender 意为“不允许如此轻易的屈服”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">enough to...</span> 结构：bitter enough to split families，enough修饰形容词bitter，to split families为结果状语。",
                "<span class=\"keyword\">语境搭配</span>：spectacle 出现在“Yet the spectacle of collapsing pines”中，本段取“壮观的景象”义；contradict 出现在“began to contradict the elders' stubborn”中，本段取“反驳”义；stance 出现在“elders' stubborn stance that the mountain”中，本段取“立场”义；rebel 出现在“wanted to rebel”中，本段取“反抗”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col4-p4",
            "segments": [
              "It was Mara, the forester, who finally offered a ",
              {
                "vocabId": "s3col4-compact",
                "text": "compact"
              },
              " remedy: ",
              {
                "vocabId": "s3col4-blend",
                "text": "blend"
              },
              " the chemical defense with a ",
              {
                "vocabId": "s3col4-therapeutic",
                "text": "therapeutic"
              },
              " replanting of native birch, whose bitter bark the beetles disdained. Patient by patient, acre by acre, the dying slopes might heal, and with them the courage of a frightened people. Only by marrying old endurance with new knowledge, she argued, could Aelvik ",
              {
                "vocabId": "s3col4-transcend",
                "text": "transcend"
              },
              " its grim fate and silence the forest's grief forever—proving that even catastrophe can be met, not with panic, but with stubborn, careful hope."
            ],
            "analysis": {
              "translation": "最终是护林员玛拉提出了一个简洁的对策：将化学防治与本土桦树的治疗性补种结合起来，而甲虫对桦树苦涩的树皮不屑一顾。一个病人接一个病人，一英亩接一英亩，那些垂死的山坡或许能痊愈，一个受惊民族的勇气也随之复苏。她认为，只有将古老的坚韧与新的知识相结合，埃尔维克才能超越它严酷的命运，永远平息森林的哀伤——证明即使面对灾难，也能不以恐慌应对，而以顽强、审慎的希望来应对。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “最终是护林员玛拉提出了一个简洁的对策：将化学防治与…” → “一个病人接一个病人，一英亩接一英亩，那些垂死的山坡…” → “她认为，只有将古老的坚韧与新的知识相结合，埃尔维克…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">强调句型</span>：It was Mara... who finally offered a compact remedy，强调主语Mara，结构为It is/was + 被强调部分 + that/who + 其余部分。",
                "<span class=\"keyword\">结构拆解</span>：the forester为Mara的同位语，补充说明其身份。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：whose bitter bark the beetles disdained 修饰birch，whose作定语，bark为从句宾语前置到从句句首。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">disdain</span> 鄙视、不屑于，the beetles disdained 意为“甲虫不屑于”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">only by... 部分倒装</span>：Only by marrying old endurance with new knowledge... could Aelvik transcend...，Only+状语置于句首引起部分倒装，could提到主语Aelvik之前。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">marry A with B</span> 将A与B结合，marrying old endurance with new knowledge 表示“将古老坚韧与新知识结合”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语proving that...作伴随状语/结果状语，that引导宾语从句作proving的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">not... but...</span> 结构：not with panic, but with stubborn, careful hope，表示“不是以恐慌，而是以顽强审慎的希望”。",
                "<span class=\"keyword\">语境搭配</span>：compact 出现在“offered a compact remedy”中，本段取“紧凑的”义；blend 出现在“blend the chemical defense”中，本段取“混合”义；therapeutic 出现在“with a therapeutic replanting of native”中，本段取“治疗的”义；transcend 出现在“could Aelvik transcend its grim fate”中，本段取“超越”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s3col5",
        "number": 5,
        "audio": {
          "src": "audio/list3_col5.mp3",
          "cues": [[2.58,2.76],[2.76,3.24],[3.46,3.58],[3.58,3.82],[3.82,4.22],[4.22,4.34],[4.34,4.54],[4.54,4.88],[4.88,5.12],[5.12,5.32],[5.32,6.4],[6.4,6.43],[6.43,6.64],[6.64,6.86],[6.86,7.36],[7.36,7.7],[7.7,7.96],[7.96,8.48],[8.48,8.86],[8.86,9.14],[9.14,9.62],null,[10.1,10.18],[10.18,10.58],[10.58,10.9],[10.9,11.12],[11.12,11.3],[11.3,11.74],[11.74,12.08],[12.08,12.36],[12.36,12.66],[12.66,12.96],[12.96,13.36],[13.36,13.98],[14.42,14.68],[14.68,14.86],[14.86,15.28],[15.28,15.6],[15.6,15.92],[15.92,16.24],[16.24,16.56],[16.56,17.06],[17.06,17.26],[17.26,17.72],[17.72,18.04],[18.04,18.3],[18.3,18.68],[19.42,19.68],[19.68,20.06],[20.06,20.42],[20.42,20.98],[20.98,21.48],[21.76,21.94],[21.94,22.3],[22.3,22.78],[22.78,23.02],[23.02,23.14],[23.14,23.5],[23.5,23.78],[23.78,23.96],[23.96,24.24],[24.24,24.76],[25.02,25.28],[25.28,25.56],[25.56,26.78],[26.78,26.81],[26.81,27],[27,27.38],[27.38,27.74],[27.74,28.26],[28.26,28.5],[28.5,28.76],[28.76,29.12],[29.78,29.9],[29.9,30.4],[30.4,30.66],[30.66,30.92],[30.92,31.32],[31.32,31.62],[31.62,32.22],[32.78,33.02],[33.02,33.48],[33.48,33.74],[33.74,34.18],[34.18,34.52],[34.52,34.76],[34.76,35.12],[35.12,35.42],[35.42,35.92],[35.92,36.24],[36.24,36.66],[37.42,37.74],[37.74,38.1],[38.1,38.6],[38.6,39.3],[39.6,39.92],[39.92,40.52],[40.52,40.76],[40.76,41],[41,41.36],[41.36,41.78],null,[42.42,42.46],[42.46,42.78],[42.78,43.04],[43.04,43.28],[43.28,43.56],[43.56,44],[44,44.32],[44.32,44.62],[44.62,45.06],[45.74,46.04],[46.04,46.82],[46.82,47.05],[47.05,47.28],[47.28,47.74],[47.74,47.96],[47.96,48.26],[48.26,48.68],[48.68,49.14],[49.14,49.42],[49.42,49.78],[49.78,50.34],[51.08,51.26],[51.26,51.52],[51.52,51.78],[51.78,52],[52,52.26],[52.26,52.5],[52.5,52.7],[52.7,52.92],[52.92,53.44],[53.94,54.14],[54.14,54.56],[54.56,54.94],[54.94,55.46],[55.46,56.42],[56.42,56.84],[56.84,57.06],[57.06,57.52],[57.96,58.18],[58.18,58.5],[58.5,58.94],[59.46,59.76],[59.76,59.79],[59.79,60],[60,60.5],null,[60.84,61.12],[61.12,61.72],[61.72,61.76],[61.76,62.12],[62.12,62.5],[62.5,62.9],[62.9,63.42],[63.42,63.94],[63.94,63.98],[63.98,64.3],[64.3,64.72],[64.72,65.26],[65.26,65.6],[65.6,66.02],[66.02,66.36],[66.36,66.7],[66.7,67.42],[67.98,68.16],[68.16,68.46],[68.46,68.88],[68.88,69.52],[69.52,69.56],[69.56,70.14],[70.56,70.84],[70.84,71.26],[71.26,71.56],[71.56,71.92],[71.92,72.2],[72.2,72.62],[72.62,72.98],[72.98,73.52],[74.02,74.28],[74.28,74.58],[74.58,75.26],[75.26,75.8],[75.8,76.22],[76.22,76.68],[76.68,77.08],[77.08,77.68],[78.34,78.8],[78.8,79.12],[79.12,79.5],[79.5,79.7],[79.7,79.94],[79.94,80.06],[80.06,80.32],[80.32,80.56],[80.56,81],[81.5,81.7],[81.7,82.34],[82.34,82.37],[82.37,82.66],[82.66,83.1],[83.1,83.28],[83.28,83.7],[83.7,84.26],[84.26,85.1],[85.1,85.48],[85.48,85.84],[85.84,86.04],[86.04,86.58],[86.58,86.63],[86.63,86.84],[86.84,87.22],[87.22,88.54],[88.54,88.59],[88.59,88.84],[88.84,89.12],[89.12,89.62],[89.92,90.18],[90.18,90.56],[90.56,90.9],[90.9,91.24],[91.24,91.62],[91.62,91.86],[91.86,92.16],[92.16,92.8],[93.5,93.66],[93.66,94.02],[94.02,94.34],[94.34,94.44],[94.44,94.98],[94.98,95.32],[95.82,96],[96,96.52],[96.68,97],[97,97.34],[97.34,97.82],[98.54,98.82],[98.82,99.14],[99.14,99.36],[99.36,99.62],[99.62,99.98],[99.98,100.5],[100.5,100.94],[101.48,101.62],[101.62,102.22],[102.22,102.48],[102.48,102.72],[102.72,102.94],[102.94,103.26],[103.26,103.48],[104.14,104.36],[104.36,104.76],[104.76,105.02],[105.02,105.38],[105.38,105.9],[105.9,106.26],[106.26,106.62],[106.62,107.12],[107.44,107.66],[107.66,107.92],[107.92,108.3],[108.96,109.2],[109.2,109.5],[109.5,109.78],[109.78,109.96],[109.96,110.2],[110.2,110.58],[110.92,111.12],[111.12,111.44],[111.44,111.78],[111.78,111.96],[111.96,112.36],[112.36,112.76],[112.76,113.12],[113.12,113.52],[113.52,113.8],[113.8,114.3],[114.3,114.98],[114.98,115.38],[115.38,116.2],[116.76,116.98],[116.98,117.2],[117.2,117.52],[117.52,117.72],[117.72,117.88],[117.88,118.12],[118.12,118.4],[118.4,118.82],[118.82,118.85],[118.85,119.06],[119.46,119.48],[119.48,119.76],[119.76,120.1],[120.1,120.72],[121.44,121.58],[121.58,121.76],[121.76,121.94],[121.94,122.28],[122.28,122.74],[122.74,122.96],[122.96,123.32],[123.32,123.66],[124.14,124.29],[124.29,124.44],[124.44,124.76],[124.76,125.9],[125.9,126.12],[126.12,126.4],[126.4,126.68],[126.68,126.96]]
        },
        "title": "第五列",
        "theme": {
          "zh": "街区新生",
          "en": "A Community Builds a New Future"
        },
        "words": [
          {
            "id": "s3col5-renovate",
            "word": "renovate",
            "pos": "v.",
            "meaning": "翻新；修复"
          },
          {
            "id": "s3col5-deprivation",
            "word": "deprivation",
            "pos": "n.",
            "meaning": "剥夺；贫困"
          },
          {
            "id": "s3col5-plausible",
            "word": "plausible",
            "pos": "adj.",
            "meaning": "似有道理的；可信的"
          },
          {
            "id": "s3col5-morality",
            "word": "morality",
            "pos": "n.",
            "meaning": "道德；道德观"
          },
          {
            "id": "s3col5-magnitude",
            "word": "magnitude",
            "pos": "n.",
            "meaning": "重要性；规模"
          },
          {
            "id": "s3col5-medieval",
            "word": "medieval",
            "pos": "adj.",
            "meaning": "中世纪的"
          },
          {
            "id": "s3col5-contempt",
            "word": "contempt",
            "pos": "n.",
            "meaning": "蔑视；轻视"
          },
          {
            "id": "s3col5-provoke",
            "word": "provoke",
            "pos": "v.",
            "meaning": "激起；挑衅"
          },
          {
            "id": "s3col5-diesel",
            "word": "diesel",
            "pos": "n.",
            "meaning": "柴油"
          },
          {
            "id": "s3col5-additive",
            "word": "additive",
            "pos": "n.",
            "meaning": "添加剂"
          },
          {
            "id": "s3col5-warrant",
            "word": "warrant",
            "pos": "v.",
            "meaning": "值得；证明……正当"
          },
          {
            "id": "s3col5-kidney",
            "word": "kidney",
            "pos": "n.",
            "meaning": "肾脏"
          },
          {
            "id": "s3col5-embody",
            "word": "embody",
            "pos": "v.",
            "meaning": "体现；代表"
          },
          {
            "id": "s3col5-viable",
            "word": "viable",
            "pos": "adj.",
            "meaning": "可行的"
          },
          {
            "id": "s3col5-edible",
            "word": "edible",
            "pos": "adj.",
            "meaning": "可食用的"
          },
          {
            "id": "s3col5-flaw",
            "word": "flaw",
            "pos": "n.",
            "meaning": "缺陷；瑕疵"
          },
          {
            "id": "s3col5-drain",
            "word": "drain",
            "pos": "n./v.",
            "meaning": "排水沟；消耗；排空"
          },
          {
            "id": "s3col5-spin",
            "word": "spin",
            "pos": "v.",
            "meaning": "旋转；歪曲叙述"
          },
          {
            "id": "s3col5-conversion",
            "word": "conversion",
            "pos": "n.",
            "meaning": "转换；改造"
          },
          {
            "id": "s3col5-vigorous",
            "word": "vigorous",
            "pos": "adj.",
            "meaning": "有力的；精力充沛的"
          },
          {
            "id": "s3col5-bust",
            "word": "bust",
            "pos": "v.",
            "meaning": "打破；使破产"
          },
          {
            "id": "s3col5-lament",
            "word": "lament",
            "pos": "v.",
            "meaning": "哀叹；惋惜"
          },
          {
            "id": "s3col5-eradicate",
            "word": "eradicate",
            "pos": "v.",
            "meaning": "根除；消灭"
          },
          {
            "id": "s3col5-resemble",
            "word": "resemble",
            "pos": "v.",
            "meaning": "类似；相似"
          },
          {
            "id": "s3col5-discard",
            "word": "discard",
            "pos": "v.",
            "meaning": "丢弃；抛弃"
          },
          {
            "id": "s3col5-likelihood",
            "word": "likelihood",
            "pos": "n.",
            "meaning": "可能性"
          },
          {
            "id": "s3col5-dispose",
            "word": "dispose",
            "pos": "v.",
            "meaning": "处理；处置"
          },
          {
            "id": "s3col5-consultation",
            "word": "consultation",
            "pos": "n.",
            "meaning": "咨询；磋商"
          },
          {
            "id": "s3col5-inferior",
            "word": "inferior",
            "pos": "adj.",
            "meaning": "劣质的；次的"
          },
          {
            "id": "s3col5-veteran",
            "word": "veteran",
            "pos": "n./adj.",
            "meaning": "老兵；经验丰富的人"
          },
          {
            "id": "s3col5-applicable",
            "word": "applicable",
            "pos": "adj.",
            "meaning": "适用的；可应用的"
          },
          {
            "id": "s3col5-sneak",
            "word": "sneak",
            "pos": "v.",
            "meaning": "偷偷地走；潜行"
          },
          {
            "id": "s3col5-predictable",
            "word": "predictable",
            "pos": "adj.",
            "meaning": "可预测的"
          },
          {
            "id": "s3col5-import",
            "word": "import",
            "pos": "v./n.",
            "meaning": "进口；引入"
          }
        ],
        "paragraphs": [
          {
            "id": "s3col5-p1",
            "segments": [
              "For decades, the ",
              {
                "vocabId": "s3col5-medieval",
                "text": "medieval"
              },
              " quarter of our town lay in ruins, a symbol of ",
              {
                "vocabId": "s3col5-deprivation",
                "text": "deprivation"
              },
              " that many outsiders viewed with ",
              {
                "vocabId": "s3col5-contempt",
                "text": "contempt"
              },
              ". The ",
              {
                "vocabId": "s3col5-magnitude",
                "text": "magnitude"
              },
              " of the decay seemed too vast to ",
              {
                "vocabId": "s3col5-warrant",
                "text": "warrant"
              },
              " serious attention, and city officials would often ",
              {
                "vocabId": "s3col5-lament",
                "text": "lament"
              },
              " the district's slow decline while doing nothing. Only one ",
              {
                "vocabId": "s3col5-plausible",
                "text": "plausible"
              },
              " solution remained: the community itself had to ",
              {
                "vocabId": "s3col5-renovate",
                "text": "renovate"
              },
              " the area from within, block by block."
            ],
            "analysis": {
              "translation": "几十年来，我们镇上的中世纪街区一直沦为废墟，成为许多外来者蔑视的贫困象征。衰败的程度似乎过于庞大，以至于不值得认真关注，市政官员常常一边哀叹这个地区的缓慢衰落，一边无所作为。只剩下一个可行的解决方案：社区本身必须从内部逐块地翻新这个地区。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “几十年来，我们镇上的中世纪街区一直沦为废墟，成为许…” → “衰败的程度似乎过于庞大，以至于不值得认真关注，市政…” → “只剩下一个可行的解决方案：社区本身必须从内部逐块地…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"the medieval quarter of our town lay in ruins\"，a symbol of deprivation为同位语补充说明。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that many outsiders viewed with contempt 修饰symbol，that作viewed的宾语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">view... with contempt</span> 以蔑视的态度看待……，with contempt表示“带着蔑视”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">too... to...</span> 结构：too vast to warrant serious attention，表示“太……以至于不能……”，意为“过于庞大而不值得认真关注”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">warrant</span> 值得、保证，to warrant serious attention 意为“值得认真关注”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">while doing nothing</span> 为while引导的省略形式的时间状语，完整形式为while they were doing nothing。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">lament</span> 哀叹、惋惜，lament the district's slow decline 表示“哀叹该地区的缓慢衰落”。",
                "<span class=\"keyword\">地道表达</span>：block by block为方式状语，表示“一块一块地、逐块地”。",
                "<span class=\"keyword\">语境搭配</span>：medieval 出现在“the medieval quarter of our”中，本段取“中世纪的”义；deprivation 出现在“symbol of deprivation that many outsiders”中，本段取“剥夺”义；contempt 出现在“viewed with contempt”中，本段取“蔑视”义；magnitude 出现在“The magnitude of the decay”中，本段取“重要性”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col5-p2",
            "segments": [
              "A ",
              {
                "vocabId": "s3col5-veteran",
                "text": "veteran"
              },
              " builder named Marta led the effort. She refused to ",
              {
                "vocabId": "s3col5-discard",
                "text": "discard"
              },
              " the original stonework, insisting that every restored wall could ",
              {
                "vocabId": "s3col5-embody",
                "text": "embody"
              },
              " the district's lost dignity. During early ",
              {
                "vocabId": "s3col5-consultation",
                "text": "consultation"
              },
              " meetings, skeptics argued the plan wasn't ",
              {
                "vocabId": "s3col5-viable",
                "text": "viable"
              },
              ", claiming the cost would ",
              {
                "vocabId": "s3col5-drain",
                "text": "drain"
              },
              " public funds for years. Yet Marta's ",
              {
                "vocabId": "s3col5-vigorous",
                "text": "vigorous"
              },
              " advocacy began to ",
              {
                "vocabId": "s3col5-provoke",
                "text": "provoke"
              },
              " genuine interest among younger residents. She pointed out the one ",
              {
                "vocabId": "s3col5-flaw",
                "text": "flaw"
              },
              " in every objection: nobody had actually tried."
            ],
            "analysis": {
              "translation": "一位名叫玛尔塔的资深建筑工带头领导了这项工作。她拒绝丢弃原有的石工，坚持认为每一面修复的墙壁都能体现该街区失去的尊严。在早期的磋商会议上，怀疑者认为这个计划不可行，声称费用会耗尽公共资金长达数年。然而玛尔塔积极的倡导开始激起年轻居民真正的兴趣。她指出了每个反对意见中的一个缺陷：实际上没有人真正尝试过。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “一位名叫玛尔塔的资深建筑工带头领导了这项工作” → “在早期的磋商会议上，怀疑者认为这个计划不可行，声称…” → “她指出了每个反对意见中的一个缺陷：实际上没有人真正…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"A veteran builder named Marta led the effort\"，过去分词named Marta作后置定语修饰builder。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">discard</span> 丢弃、抛弃，refused to discard the original stonework 表示“拒绝丢弃原有石工”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语insisting that...作伴随状语，that引导宾语从句作insisting的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">embody</span> 体现、使具体化，could embody the district's lost dignity 意为“能体现该街区失去的尊严”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语claiming the cost would drain public funds作伴随状语，that被省略，claiming后接宾语从句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">drain</span> 耗尽、排空，drain public funds 表示“耗尽公共资金”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">provoke</span> 激起、引发，provoke genuine interest 意为“激起真正的兴趣”。",
                "<span class=\"keyword\">结构拆解</span>：冒号后nobody had actually tried为the one flaw的同位语从句，解释说明缺陷的内容。",
                "<span class=\"keyword\">语境搭配</span>：veteran 出现在“A veteran builder named Marta”中，本段取“老兵”义；discard 出现在“refused to discard the original stonework”中，本段取“丢弃”义；embody 出现在“wall could embody the district's lost”中，本段取“体现”义；consultation 出现在“During early consultation meetings”中，本段取“咨询”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col5-p3",
            "segments": [
              "Volunteers set to work. They cleared rubble, fixed a broken ",
              {
                "vocabId": "s3col5-drain",
                "text": "drain"
              },
              ", and transformed a derelict warehouse through ",
              {
                "vocabId": "s3col5-conversion",
                "text": "conversion"
              },
              " into a community kitchen serving ",
              {
                "vocabId": "s3col5-edible",
                "text": "edible"
              },
              " meals from salvaged produce. To safely ",
              {
                "vocabId": "s3col5-dispose",
                "text": "dispose"
              },
              " of hazardous waste, including old ",
              {
                "vocabId": "s3col5-diesel",
                "text": "diesel"
              },
              " drums and chemical ",
              {
                "vocabId": "s3col5-additive",
                "text": "additive"
              },
              " containers, they followed regulations ",
              {
                "vocabId": "s3col5-applicable",
                "text": "applicable"
              },
              " to industrial cleanup sites. Sometimes children would ",
              {
                "vocabId": "s3col5-sneak",
                "text": "sneak"
              },
              " in to watch the progress, their excitement a ",
              {
                "vocabId": "s3col5-predictable",
                "text": "predictable"
              },
              " sign of changing attitudes."
            ],
            "analysis": {
              "translation": "志愿者们开始工作。他们清理瓦砾，修好破损的下水道，并通过改造将一座废弃仓库变成社区厨房，用抢救回来的农产品提供可食用的饭菜。为了安全处置有害废物，包括旧柴油桶和化学添加剂容器，他们遵循适用于工业清理场地的规定。有时孩子们会溜进来观看进展，他们的兴奋是态度正在改变的预料之中的标志。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “志愿者们开始工作” → “为了安全处置有害废物，包括旧柴油桶和化学添加剂容器…” → “有时孩子们会溜进来观看进展，他们的兴奋是态度正在改…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">set to work</span> 开始工作、着手干活，set to表示“开始着手”。",
                "<span class=\"keyword\">逻辑衔接</span>：该句为三个并列谓语：cleared rubble, fixed a broken drain, and transformed a derelict warehouse。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">through conversion into</span> 通过改造转变为，through conversion作方式状语。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语serving edible meals from salvaged produce作后置定语，修饰community kitchen，表示“用抢救回来的农产品提供可食用饭菜的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">dispose of</span> 处理、处置，To safely dispose of hazardous waste 为目的状语（不定式）。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：形容词短语applicable to industrial cleanup sites作后置定语，修饰regulations，表示“适用于工业清理场地的”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">sneak in</span> 偷偷溜进来，would sneak in表示“会溜进来”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">独立主格结构</span>：their excitement a predictable sign of changing attitudes，由名词+名词短语构成，表伴随情况，excitement与主句主语children不同。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：drain 出现在“a broken drain”中，本段取“排水沟”义；conversion 出现在“warehouse through conversion into a community”中，本段取“转换”义；edible 出现在“kitchen serving edible meals from salvaged”中，本段取“可食用的”义；dispose 出现在“To safely dispose of hazardous waste”中，本段取“处理”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col5-p4",
            "segments": [
              "The results began to ",
              {
                "vocabId": "s3col5-resemble",
                "text": "resemble"
              },
              " a real neighborhood again. A small clinic opened, even offering ",
              {
                "vocabId": "s3col5-kidney",
                "text": "kidney"
              },
              " health screening for elderly residents. The ",
              {
                "vocabId": "s3col5-likelihood",
                "text": "likelihood"
              },
              " of the district's revival, once unthinkable, now seemed certain. Marta refused to let officials ",
              {
                "vocabId": "s3col5-import",
                "text": "import"
              },
              " cheap, ",
              {
                "vocabId": "s3col5-inferior",
                "text": "inferior"
              },
              " materials that would undercut the work. She argued that ",
              {
                "vocabId": "s3col5-morality",
                "text": "morality"
              },
              " demanded they build honestly, not just cheaply. To ",
              {
                "vocabId": "s3col5-bust",
                "text": "bust"
              },
              " the cycle of poverty, the community had to ",
              {
                "vocabId": "s3col5-eradicate",
                "text": "eradicate"
              },
              " the assumption that poor neighborhoods deserve poor craftsmanship."
            ],
            "analysis": {
              "translation": "结果开始再次像一个真正的社区了。一家小诊所开业了，甚至为老年居民提供肾脏健康筛查。这个街区复兴的可能性——曾经不可想象——现在看来已确定无疑。玛尔塔拒绝让官员进口会削弱工程质量的廉价劣质材料。她争辩说，道德要求他们诚实建造，而不是仅仅图便宜。为了打破贫困的循环，社区必须根除一种假设，即贫困社区只配得到低劣的工艺。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “结果开始再次像一个真正的社区了” → “玛尔塔拒绝让官员进口会削弱工程质量的廉价劣质材料” → “为了打破贫困的循环，社区必须根除一种假设，即贫困社…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The results began to resemble a real neighborhood again\"，begin to do sth.结构。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语even offering kidney health screening for elderly residents作伴随状语，补充说明诊所的功能。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">插入语</span>：once unthinkable 为插入成分，修饰the likelihood of the district's revival，表示“曾经不可想象的”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that would undercut the work 修饰materials，that作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that morality demanded they build honestly, not just cheaply 作argued的宾语，其中demand后接宾语从句使用虚拟语气(should) build。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">虚拟语气</span>：demanded they build honestly，demand后的宾语从句中谓语用动词原形build（省略should）。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">bust</span> 打破、粉碎，To bust the cycle of poverty 为目的状语，表示“打破贫困循环”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">同位语从句</span>：that poor neighborhoods deserve poor craftsmanship 作assumption的同位语，解释假设的内容。",
                "<span class=\"keyword\">语境搭配</span>：resemble 出现在“began to resemble a real neighborhood”中，本段取“类似”义；kidney 出现在“even offering kidney health screening for”中，本段取“肾脏”义；likelihood 出现在“The likelihood of the district's”中，本段取“可能性”义；import 出现在“let officials import cheap”中，本段取“进口”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s3col5-p5",
            "segments": [
              "When critics tried to ",
              {
                "vocabId": "s3col5-spin",
                "text": "spin"
              },
              " the project as a failure, the evidence spoke otherwise. What had been ruins now stood as homes, gardens, and gathering spaces—a future built by hand."
            ],
            "analysis": {
              "translation": "当批评者试图将这个项目歪曲为失败时，证据却说明了相反的情况。曾经是废墟的地方如今矗立为住宅、花园和聚会场所——一个亲手建造的未来。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当批评者试图将这个项目歪曲为失败时，证据却说明了相…” → “曾经是废墟的地方如今矗立为住宅、花园和聚会场所——…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">时间状语从句</span>：When critics tried to spin the project as a failure，由When引导。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">spin... as...</span> 将……歪曲/描绘成……，spin the project as a failure 意为“将项目说成失败”。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"the evidence spoke otherwise“，otherwise为副词作状语，表示”相反地\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">主语从句</span>：What had been ruins 作主语，what引导名词性从句，在从句中作主语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">stand as</span> 作为……而矗立/存在，stood as homes, gardens, and gathering spaces 表示“矗立为住宅、花园和聚会场所”。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号后a future built by hand为同位语，概括前面所述内容，过去分词built by hand作后置定语修饰future。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：spin 出现在“tried to spin the project as”中，本段取“旋转”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "set4",
    "number": 4,
    "label": "第四份",
    "columns": [
      {
        "id": "s4col1",
        "number": 1,
        "audio": {
          "src": "audio/list4_col1.mp3",
          "cues": [[3.34,3.54],[3.54,3.78],[3.78,4.16],[4.16,4.54],[4.54,5.02],[5.02,5.44],[5.44,5.84],[5.84,6.24],[6.24,6.62],[6.62,7.28],[7.28,7.3],[7.3,7.48],[7.48,8.12],[8.24,8.66],[8.66,8.92],[8.92,9.34],[9.34,9.64],[9.64,9.98],[9.98,10.64],[10.64,10.9],[10.9,11.08],[11.08,11.44],[11.44,11.88],[11.88,12.24],[12.24,12.8],null,[13.6,13.86],[13.86,14.08],[14.08,14.38],[14.38,14.74],[14.74,14.9],[14.9,15.14],[15.14,15.4],[15.4,16.32],[16.32,16.36],[16.36,16.66],[16.66,17.16],[17.16,17.56],[17.56,17.8],[17.8,18.02],[18.02,18.36],[18.68,18.82],[18.82,19],[19,19.16],[19.16,19.46],[19.46,19.78],[19.78,20.18],[20.18,20.76],[20.76,20.8],[20.8,21.02],[21.02,21.56],[22.32,22.64],[22.64,23.1],[23.56,23.81],[23.81,24.06],[24.48,24.68],[24.68,24.96],[24.96,25.22],[25.22,25.42],[25.42,25.6],[25.6,25.92],[25.92,26.14],[26.14,26.44],[26.44,26.82],[26.82,27.3],[27.3,27.8],[27.8,28.1],[28.1,28.46],[28.46,29.16],[29.92,30.08],[30.08,31.08],[31.08,31.12],[31.12,31.58],[31.58,32.1],[32.1,32.5],[32.5,32.68],[32.68,32.88],[32.88,33.08],[33.08,33.36],[33.36,33.6],[33.6,33.92],[33.92,34.4],[34.76,35],[35,35.32],[35.32,35.74],[35.74,36],[36,36.68],[36.68,36.9],[37.26,37.4],[37.4,37.74],[37.74,38.1],[38.1,38.38],[38.38,38.66],[38.66,39.22],[39.56,39.68],[39.68,40.3],[40.3,40.34],[40.34,40.64],[40.64,40.94],[40.94,41.18],[41.18,41.46],[41.46,42.66],[42.66,42.7],[42.7,42.98],[42.98,43.16],[43.16,43.3],[43.3,43.58],[43.58,43.9],[43.9,44.8],[44.8,45.16],[45.16,46.08],[46.08,46.13],[46.13,46.24],[46.24,46.4],[46.4,46.7],[46.7,47.18],null,[47.76,48.08],[48.08,48.38],[48.38,48.9],[48.9,49.3],[49.3,49.88],[50.62,51.06],[51.06,51.48],[51.48,52.02],[52.02,52.54],[52.54,53.1],[53.1,53.48],[53.48,53.86],[53.86,54.18],[54.18,54.7],[55.26,55.66],[55.66,56.18],[56.18,56.42],[56.42,56.62],[56.62,56.94],[56.94,57.22],[57.22,57.52],[57.52,57.86],[57.86,58.22],[58.22,58.27],[58.27,58.54],[58.54,58.9],[58.9,59.5],[59.92,60.16],[60.16,60.36],[60.36,60.68],[60.68,61.24],[61.64,61.78],[61.78,62.24],[62.24,62.68],[62.68,63.04],[63.04,63.58],[63.58,64.12],[64.64,65.18],[65.18,65.4],[65.4,65.74],[65.74,66.36],[67.06,67.42],[67.42,67.66],[67.66,68.04],[68.04,68.84],[69.26,69.52],[69.52,69.66],[69.66,70.06],[70.06,70.5],[70.5,70.54],[70.54,70.76],[70.76,71.2],[71.2,71.46],[71.46,71.78],[71.78,72.2],[72.2,72.44],[72.44,72.82],[72.82,73.28],[73.28,73.88],[74.52,74.72],[74.72,75],[75,75.34],[75.34,75.68],[75.68,75.72],[75.72,76.04],[76.04,76.56],[76.56,76.9],[76.9,77.3],[77.3,77.56],[77.56,77.88],[77.88,78.28],[78.28,78.7],[78.7,78.94],[78.94,79.32],[79.32,79.74],[79.74,79.9],[79.9,80.04],[80.04,80.48],[80.48,81.32],[81.32,81.66],[81.66,82],[82,82.48],[82.48,82.94],[83.28,83.48],[83.48,83.82],[83.82,84.22],[84.22,84.7],[84.7,85.92],[85.92,86.18],[86.18,86.54],[86.54,86.9],[86.9,87.26],[87.26,87.52],[87.52,87.84],[87.84,88.28],[88.28,88.76],[89.04,89.28],[89.28,89.52],[89.52,89.98],[89.98,90.08],[90.08,90.5],[90.88,91.16],[91.16,91.44],[91.44,91.7],[91.7,91.94],[91.94,92.4],[93.1,93.28],[93.28,93.66],[93.66,94.22],[94.22,94.74],[94.74,95.08],[95.08,95.13],[95.13,95.36],[95.36,95.74],[95.74,96.04],[96.04,96.32],[96.32,96.62],[96.62,97],null,[97.54,97.76],[97.76,98],[98,98.32],[98.32,98.64],[98.64,98.98],[98.98,99.22],[99.22,99.58],[99.58,100.1],[100.1,100.15],[100.15,100.52],[100.52,100.96],[101.64,102.06],[102.06,102.6],[103.14,103.16],[103.16,103.54],[103.54,104],[104,104.32],[104.32,104.54],[104.54,105.18],[105.92,106.24],[106.24,106.56],[106.56,106.84],[106.84,107.12],[107.12,107.74],[107.74,108.4],[108.4,108.41],[108.41,108.48],[108.48,108.78],[108.78,109.08],[109.08,109.78],[109.78,109.83],[109.83,110.12],[110.12,110.36],[110.36,110.62],[110.62,110.96],[110.96,111.22],[111.22,111.5],[111.5,111.9],[111.9,112.24],[112.24,112.56],[112.56,112.78],[112.78,113.56],[114.2,114.4],[114.4,114.82],[114.82,115.22],[115.34,115.72],[115.72,116.24],[116.24,116.28],[116.28,116.56],[116.56,117.18],null,[117.94,118.04],[118.04,118.22],[118.22,118.46],[118.46,119.38],[119.38,119.84],[119.84,120],[120,120.26],[120.26,120.66],[120.66,120.9],[120.9,121.28],[121.28,121.56],[121.56,121.86],[121.86,122.16],[122.16,122.46],[122.46,122.76],[122.76,123],[123,123.4],[123.4,123.86]]
        },
        "title": "第一列",
        "theme": {
          "zh": "街区复兴",
          "en": "A District Fights Bankruptcy to Find Renewal"
        },
        "words": [
          {
            "id": "s4col1-dread",
            "word": "dread",
            "pos": "n.",
            "meaning": "恐惧；畏惧"
          },
          {
            "id": "s4col1-modernize",
            "word": "modernize",
            "pos": "v.",
            "meaning": "使现代化"
          },
          {
            "id": "s4col1-conscientious",
            "word": "conscientious",
            "pos": "adj.",
            "meaning": "认真的；尽责的"
          },
          {
            "id": "s4col1-evaporate",
            "word": "evaporate",
            "pos": "v.",
            "meaning": "蒸发；消失"
          },
          {
            "id": "s4col1-fraction",
            "word": "fraction",
            "pos": "n.",
            "meaning": "小部分；一点儿"
          },
          {
            "id": "s4col1-bruising",
            "word": "bruising",
            "pos": "adj.",
            "meaning": "艰苦的；激烈的"
          },
          {
            "id": "s4col1-overstate",
            "word": "overstate",
            "pos": "v.",
            "meaning": "夸大；言过其实"
          },
          {
            "id": "s4col1-duplicate",
            "word": "duplicate",
            "pos": "adj.",
            "meaning": "复制的；完全相同的"
          },
          {
            "id": "s4col1-revelation",
            "word": "revelation",
            "pos": "n.",
            "meaning": "揭示；惊人的发现"
          },
          {
            "id": "s4col1-specialty",
            "word": "specialty",
            "pos": "n.",
            "meaning": "特色食品；特产"
          },
          {
            "id": "s4col1-affection",
            "word": "affection",
            "pos": "n.",
            "meaning": "喜爱；感情"
          },
          {
            "id": "s4col1-tame",
            "word": "tame",
            "pos": "v.",
            "meaning": "驯服；制服；整治"
          },
          {
            "id": "s4col1-primitive",
            "word": "primitive",
            "pos": "adj.",
            "meaning": "原始的；粗犷的"
          },
          {
            "id": "s4col1-tranquility",
            "word": "tranquility",
            "pos": "n.",
            "meaning": "宁静；平静"
          },
          {
            "id": "s4col1-irrigate",
            "word": "irrigate",
            "pos": "v.",
            "meaning": "灌溉"
          },
          {
            "id": "s4col1-staple",
            "word": "staple",
            "pos": "adj.",
            "meaning": "主要的；基本的"
          },
          {
            "id": "s4col1-frantic",
            "word": "frantic",
            "pos": "adj.",
            "meaning": "慌乱的；狂乱的"
          },
          {
            "id": "s4col1-badge",
            "word": "badge",
            "pos": "n.",
            "meaning": "徽章；象征"
          },
          {
            "id": "s4col1-scoop",
            "word": "scoop",
            "pos": "n.",
            "meaning": "独家新闻；独家报道"
          },
          {
            "id": "s4col1-corrosive",
            "word": "corrosive",
            "pos": "adj.",
            "meaning": "腐蚀性的；破坏性的"
          },
          {
            "id": "s4col1-marginal",
            "word": "marginal",
            "pos": "adj.",
            "meaning": "边缘的；微不足道的"
          },
          {
            "id": "s4col1-nominal",
            "word": "nominal",
            "pos": "adj.",
            "meaning": "象征性的；名义上的"
          },
          {
            "id": "s4col1-preliminary",
            "word": "preliminary",
            "pos": "adj.",
            "meaning": "初步的；预备的"
          },
          {
            "id": "s4col1-bureaucracy",
            "word": "bureaucracy",
            "pos": "n.",
            "meaning": "官僚主义；官僚机构"
          },
          {
            "id": "s4col1-instruction",
            "word": "instruction",
            "pos": "n.",
            "meaning": "指示；说明"
          },
          {
            "id": "s4col1-bankruptcy",
            "word": "bankruptcy",
            "pos": "n.",
            "meaning": "破产"
          },
          {
            "id": "s4col1-dazzle",
            "word": "dazzle",
            "pos": "v.",
            "meaning": "使目眩；使倾倒"
          },
          {
            "id": "s4col1-spacious",
            "word": "spacious",
            "pos": "adj.",
            "meaning": "宽敞的"
          },
          {
            "id": "s4col1-layoff",
            "word": "layoff",
            "pos": "n.",
            "meaning": "裁员；解雇"
          },
          {
            "id": "s4col1-endorsement",
            "word": "endorsement",
            "pos": "n.",
            "meaning": "认可；支持；背书"
          },
          {
            "id": "s4col1-bleak",
            "word": "bleak",
            "pos": "adj.",
            "meaning": "黯淡的；荒凉的"
          }
        ],
        "paragraphs": [
          {
            "id": "s4col1-p1",
            "segments": [
              "The ",
              {
                "vocabId": "s4col1-bleak",
                "text": "bleak"
              },
              " factories along Riverbend's canals stood as monuments to a vanishing age, and residents watched their savings ",
              {
                "vocabId": "s4col1-evaporate",
                "text": "evaporate"
              },
              " as the district slid toward ",
              {
                "vocabId": "s4col1-bankruptcy",
                "text": "bankruptcy"
              },
              ". After the latest ",
              {
                "vocabId": "s4col1-layoff",
                "text": "layoff"
              },
              " at the textile mill, a ",
              {
                "vocabId": "s4col1-frantic",
                "text": "frantic"
              },
              " despair settled over the streets, and the ",
              {
                "vocabId": "s4col1-dread",
                "text": "dread"
              },
              " of total collapse became a daily companion. Shops shuttered, families packed, and hope seemed to drain away with each passing week."
            ],
            "analysis": {
              "translation": "河弯区运河沿岸那些萧条的工厂成了逝去时代的纪念碑，居民们眼看着自己的积蓄随着该地区滑向破产而蒸发。纺织厂最近一次裁员后，一种疯狂的绝望笼罩了街道，对彻底崩溃的恐惧成了日常的伴侣。商店关门，家庭搬离，希望似乎随着每周的流逝而流尽。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “河弯区运河沿岸那些萧条的工厂成了逝去时代的纪念碑，…” → “纺织厂最近一次裁员后，一种疯狂的绝望笼罩了街道，对…” → “商店关门，家庭搬离，希望似乎随着每周的流逝而流尽” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：该句由and连接两个并列分句，主干为\"The bleak factories... stood as monuments... and residents watched their savings evaporate\"。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">stand as</span> 作为……而矗立/存在，stood as monuments to a vanishing age 意为“成为逝去时代的纪念碑”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">evaporate</span> 蒸发、消散，watched their savings evaporate 中evaporate为宾语补足语（省略to的不定式）。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：as the district slid toward bankruptcy，由as引导，表示“随着……”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">slide toward</span> 滑向，slid toward bankruptcy 表示“滑向破产”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">settle over</span> 笼罩于……之上，a frantic despair settled over the streets 意为“绝望笼罩了街道”。",
                "<span class=\"keyword\">逻辑衔接</span>：三个并列短句Shops shuttered, families packed, and hope seemed to drain away 构成排比，营造萧条氛围。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">drain away</span> 流尽、逐渐消失，hope seemed to drain away 表示“希望似乎在流尽”。",
                "<span class=\"keyword\">语境搭配</span>：bleak 出现在“The bleak factories along Riverbend's”中，本段取“黯淡的”义；evaporate 出现在“their savings evaporate as the district”中，本段取“蒸发”义；bankruptcy 出现在“slid toward bankruptcy”中，本段取“破产”义；layoff 出现在“the latest layoff at the textile”中，本段取“裁员”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col1-p2",
            "segments": [
              "Yet not everyone surrendered. Mara Voss, a ",
              {
                "vocabId": "s4col1-conscientious",
                "text": "conscientious"
              },
              " urban planner who had grown up among these streets, refused to ",
              {
                "vocabId": "s4col1-overstate",
                "text": "overstate"
              },
              " the district's chances but also refused to abandon it. She secured a ",
              {
                "vocabId": "s4col1-nominal",
                "text": "nominal"
              },
              " grant from city hall—barely a ",
              {
                "vocabId": "s4col1-fraction",
                "text": "fraction"
              },
              " of what was truly needed—only after surviving a ",
              {
                "vocabId": "s4col1-bruising",
                "text": "bruising"
              },
              " battle with ",
              {
                "vocabId": "s4col1-bureaucracy",
                "text": "bureaucracy"
              },
              ". Every form required ",
              {
                "vocabId": "s4col1-duplicate",
                "text": "duplicate"
              },
              " copies; every permit demanded explicit ",
              {
                "vocabId": "s4col1-instruction",
                "text": "instruction"
              },
              " from three separate departments. The ",
              {
                "vocabId": "s4col1-corrosive",
                "text": "corrosive"
              },
              " effect of such delays had already killed a dozen promising projects, but Mara pressed on."
            ],
            "analysis": {
              "translation": "然而并非所有人都放弃了。玛拉·沃斯，一位在这些街道间长大的尽责的城市规划师，不愿夸大该地区的机会，但也不愿放弃它。她从市政厅获得了一笔名义上的拨款——仅仅是真正所需的一小部分——那还是在经历了一场与官僚主义的艰苦斗争之后。每份表格都需要副本；每个许可证都需要三个不同部门的明确指示。这种拖延的腐蚀性影响已经扼杀了十几个有前途的项目，但玛拉坚持前行。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “并非所有人都放弃了” → “她从市政厅获得了一笔名义上的拨款——仅仅是真正所需…” → “这种拖延的腐蚀性影响已经扼杀了十几个有前途的项目，…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"Mara Voss... refused to overstate the district's chances but also refused to abandon it\"，由but also连接两个并列谓语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">同位语</span>：a conscientious urban planner 为Mara Voss的同位语，补充身份。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：who had grown up among these streets 修饰urban planner，who作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">overstate</span> 夸大、言过其实，refused to overstate 表示“拒绝夸大”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：what was truly needed 作介词of的宾语，what引导名词性从句。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">only after... 时间状语</span>：only after surviving a bruising battle with bureaucracy，表示“只有在经历……之后才……”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">explicit instruction</span> 明确的指示，demanded explicit instruction from three separate departments 表示“需要三个不同部门的明确指示”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">corrosive</span> 腐蚀性的，The corrosive effect of such delays 意为“这种拖延的腐蚀性影响”。",
                "<span class=\"keyword\">语境搭配</span>：conscientious 出现在“a conscientious urban planner who”中，本段取“认真的”义；overstate 出现在“refused to overstate the district's chances”中，本段取“夸大”义；nominal 出现在“secured a nominal grant from city”中，本段取“象征性的”义；fraction 出现在“barely a fraction of what was”中，本段取“小部分”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col1-p3",
            "segments": [
              "Her ",
              {
                "vocabId": "s4col1-preliminary",
                "text": "preliminary"
              },
              " plan was deceptively simple: ",
              {
                "vocabId": "s4col1-modernize",
                "text": "modernize"
              },
              " the crumbling waterfront, ",
              {
                "vocabId": "s4col1-irrigate",
                "text": "irrigate"
              },
              " the abandoned greenhouses, and convert them into a lively market where vendors could sell local ",
              {
                "vocabId": "s4col1-specialty",
                "text": "specialty"
              },
              " foods. The centerpiece would be a ",
              {
                "vocabId": "s4col1-spacious",
                "text": "spacious"
              },
              " community hall designed to ",
              {
                "vocabId": "s4col1-dazzle",
                "text": "dazzle"
              },
              " visitors and draw tourism back to the district. To ",
              {
                "vocabId": "s4col1-tame",
                "text": "tame"
              },
              " the overgrown lots, she hired former factory workers—men whose rough hands still moved with ",
              {
                "vocabId": "s4col1-primitive",
                "text": "primitive"
              },
              " strength but who held a deep, stubborn ",
              {
                "vocabId": "s4col1-affection",
                "text": "affection"
              },
              " for their neighborhood."
            ],
            "analysis": {
              "translation": "她的初步计划看似简单得带有欺骗性：现代化摇摇欲坠的滨水区，灌溉废弃的温室，并将它们改造成一个热闹的市场，摊贩们可以在那里出售当地特色食品。核心将是一座宽敞的社区大厅，旨在令访客赞叹并吸引旅游业回到该地区。为了整治杂草丛生的空地，她雇用了前工厂工人——这些男人粗糙的双手仍然带着原始的力量移动，但对自己的社区怀有深沉而顽固的眷恋。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她的初步计划看似简单得带有欺骗性：现代化摇摇欲坠的…” → “核心将是一座宽敞的社区大厅，旨在令访客赞叹并吸引旅…” → “为了整治杂草丛生的空地，她雇用了前工厂工人——这些…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"Her preliminary plan was deceptively simple\"，冒号后三个并列不定式短语modernize..., irrigate..., and convert... 作plan的同位语/解释说明。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">deceptively</span> 迷惑性地、看似……实则不然，deceptively simple 意为“看似简单实则不然”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：where vendors could sell local specialty foods 修饰market，where作地点状语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：过去分词短语designed to dazzle visitors and draw tourism back作后置定语，修饰community hall。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">dazzle</span> 使目眩、使赞叹，designed to dazzle visitors 表示“旨在令访客赞叹”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">目的状语</span>：To tame the overgrown lots 为不定式短语作目的状语，意为“为了整治杂草丛生的空地”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">并列定语从句</span>：whose rough hands still moved... but who held a deep, stubborn affection... 由but连接两个并列定语从句，均修饰men，表示转折关系。",
                "<span class=\"keyword\">语境搭配</span>：preliminary 出现在“Her preliminary plan was deceptively”中，本段取“初步的”义；modernize 出现在“modernize the crumbling waterfront”中，本段取“使现代化”义；irrigate 出现在“irrigate the abandoned greenhouses”中，本段取“灌溉”义；specialty 出现在“sell local specialty foods”中，本段取“特色食品”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col1-p4",
            "segments": [
              "The breakthrough ",
              {
                "vocabId": "s4col1-revelation",
                "text": "revelation"
              },
              " came when a young journalist got the inside ",
              {
                "vocabId": "s4col1-scoop",
                "text": "scoop"
              },
              ": the plan had quietly won the ",
              {
                "vocabId": "s4col1-endorsement",
                "text": "endorsement"
              },
              " of a retired governor. Almost overnight, ",
              {
                "vocabId": "s4col1-marginal",
                "text": "marginal"
              },
              " skeptics turned into eager supporters. Workers wore their new responsibilities like a ",
              {
                "vocabId": "s4col1-badge",
                "text": "badge"
              },
              " of pride, and a ",
              {
                "vocabId": "s4col1-staple",
                "text": "staple"
              },
              " crop of fresh herbs and greens filled the greenhouse shelves."
            ],
            "analysis": {
              "translation": "突破性的启示来临了——一位年轻记者获得了内幕消息：该计划已悄然赢得了一位退休州长的支持。几乎一夜之间，边缘的怀疑者变成了热切的支持者。工人们像佩戴荣誉徽章一样担负起新的责任，新鲜香草和蔬菜这些主要作物摆满了温室的货架。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “突破性的启示来临了——一位年轻记者获得了内幕消息：…” → “几乎一夜之间，边缘的怀疑者变成了热切的支持者” → “工人们像佩戴荣誉徽章一样担负起新的责任，新鲜香草和…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The breakthrough revelation came\"，when引导时间状语从句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：when a young journalist got the inside scoop，由when引导。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">get the inside scoop</span> 获得内幕消息，scoop意为“独家新闻、内幕”。",
                "<span class=\"keyword\">结构拆解</span>：冒号后the plan had quietly won the endorsement of a retired governor 为inside scoop的同位语从句，解释内幕内容。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">endorsement</span> 支持、背书，won the endorsement of 表示“赢得……的支持”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">turn into</span> 变成、转变为，marginal skeptics turned into eager supporters 表示“边缘怀疑者变成热切支持者”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">wore... like a badge of pride</span> 像佩戴荣誉徽章一样承担……，为明喻修辞。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">staple crop</span> 主要作物，a staple crop of fresh herbs and greens 意为“新鲜香草和绿叶菜这些主要作物”。",
                "<span class=\"keyword\">语境搭配</span>：revelation 出现在“The breakthrough revelation came when a”中，本段取“揭示”义；scoop 出现在“the inside scoop”中，本段取“独家新闻”义；endorsement 出现在“won the endorsement of a retired”中，本段取“认可”义；marginal 出现在“marginal skeptics turned into”中，本段取“边缘的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col1-p5",
            "segments": [
              "Within two years, Riverbend found a fragile ",
              {
                "vocabId": "s4col1-tranquility",
                "text": "tranquility"
              },
              ". It was not prosperity—not yet—but the district had proven that renewal could take root even in exhausted soil."
            ],
            "analysis": {
              "translation": "两年之内，河弯区找到了一种脆弱的宁静。那不是繁荣——还不是——但这个地区已经证明，复兴即使在精疲力竭的土壤中也能扎根。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “两年之内，河弯区找到了一种脆弱的宁静” → “那不是繁荣——还不是——但这个地区已经证明，复兴即…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"Riverbend found a fragile tranquility“，found此处意为”获得、找到\"。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">fragile tranquility</span> 脆弱的宁静，fragile修饰tranquility，表示不稳定但珍贵的和平。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">强调句型</span>：It was not prosperity—not yet—but...，使用It was...结构，but表转折。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that renewal could take root even in exhausted soil 作proven的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">take root</span> 扎根，renewal could take root 表示“复兴能够扎根”，为隐喻修辞。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">exhausted soil</span> 精疲力竭的土壤，既指实际土壤也暗喻被耗尽的社区，为双关修辞。",
                "<span class=\"keyword\">语境搭配</span>：tranquility 出现在“a fragile tranquility”中，本段取“宁静”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s4col2",
        "number": 2,
        "audio": {
          "src": "audio/list4_col2.mp3",
          "cues": [[2.7,2.88],[2.88,3.02],[3.02,3.38],[3.38,3.86],[3.86,4.26],[4.26,4.52],[4.52,4.86],[4.86,5.1],[5.1,5.36],[5.36,5.58],[5.58,6.04],[6.04,6.32],[6.32,6.72],[7.18,7.42],[7.42,7.68],[7.68,8.12],[8.12,8.3],[8.3,8.72],[8.72,8.92],[8.92,9.18],[9.18,9.54],[10.26,10.68],[10.68,11.04],[11.04,11.26],[11.26,11.52],[11.52,11.8],[11.8,12.18],[12.56,12.9],[12.9,12.93],[12.93,13.08],[13.08,13.5],[13.5,13.72],[13.72,13.92],[13.92,14.26],[14.26,14.62],[14.62,15.06],[15.06,15.38],[15.38,15.7],[15.7,16.1],null,[16.6,16.7],[16.7,17.08],[17.08,17.54],[17.54,17.92],[18.66,18.84],[18.84,19.18],[19.18,19.6],[19.6,19.88],[19.88,20.2],[20.2,20.56],[20.56,20.78],[20.78,21.2],[21.2,21.52],[21.86,22.08],[22.08,22.3],[22.3,22.74],[22.74,22.79],[22.79,23.1],[23.1,23.4],[23.4,23.82],[23.82,24.22],[25.06,25.26],[25.26,25.52],[25.52,25.86],[25.86,26.24],[26.24,27.16],[27.16,27.4],[27.4,27.68],[27.68,27.92],[27.92,28.26],[28.26,28.48],[28.48,28.74],[28.74,29.24],[29.24,29.76],[29.76,30.02],[30.02,30.6],[31.32,31.66],[31.84,32.02],[32.02,32.42],[32.42,32.96],[33.24,33.6],[33.6,33.76],[33.76,34.12],[34.12,34.58],[34.58,34.63],[34.63,34.88],null,[35.22,35.42],[35.42,35.58],[35.58,35.88],[35.88,36.2],[36.2,36.86],[36.86,37.16],[37.16,37.42],[37.42,37.92],[37.92,38.3],[38.3,38.68],[38.68,39.06],[39.06,39.4],[39.4,39.8],[40.42,40.62],[40.62,40.98],[40.98,41.56],[41.56,42.46],[42.96,43.28],[43.28,43.46],[43.46,43.9],[43.9,44.26],[44.26,44.54],[44.54,44.88],[45.64,45.88],[45.88,46.26],[46.26,46.7],[46.7,47],[47,47.22],[47.22,47.8],[47.8,48.28],[48.28,48.72],[48.72,49.16],[49.16,49.5],[49.5,50.02],[50.02,50.3],null,[51.04,51.38],[51.38,51.8],[51.94,52.16],[52.16,52.62],[52.62,53.12],[53.12,53.16],[53.16,53.54],[53.54,54.04],[54.04,54.5],[54.5,55.3],[55.3,55.72],[55.72,56.12],[56.12,56.76],[56.76,57.38],[57.38,57.96],[57.96,58.52],[58.52,58.96],[58.96,59.2],[59.2,59.54],[59.54,60.08],[60.72,60.94],[60.94,61.58],[61.58,61.88],[61.88,62.64],[62.64,62.94],[62.94,63.42],[63.42,63.72],[63.72,64.3],[64.82,64.92],[64.92,65.18],[65.18,65.5],[65.5,65.9],[65.9,66.18],[66.18,66.5],[66.5,66.86],[66.86,67.2],[67.2,67.54],[67.54,67.86],[67.86,68.18],[68.18,69],[69,69.28],[69.28,69.56],[70.38,70.56],[70.56,70.78],[70.78,71],[71,71.42],[71.42,71.6],[71.6,71.76],[71.76,72.08],[72.08,72.34],[72.34,73.02],[73.02,73.05],[73.05,73.28],[73.28,74.06],[74.48,74.82],[74.82,75.08],[75.08,75.46],[75.46,75.74],[75.74,76.14],[76.14,76.52],[76.52,76.88],[76.88,77.08],[77.08,77.38],[77.38,77.64],[77.64,77.86],[78.54,78.68],[78.68,79.08],[79.08,79.5],[79.82,80.06],[80.06,80.38],[80.38,80.88],[80.88,81.98],[81.98,81.99],[81.99,82.06],[82.06,82.4],[82.4,82.98],[82.98,83.52],[83.52,84.08],[84.08,84.66],[84.66,85.22],[85.22,85.82],[85.82,86.96],[86.96,87.18],[87.18,87.64],[87.64,87.86],[87.86,88.22],[88.22,88.62],[88.62,88.96],[88.96,89.18],[89.18,89.86],[90.6,90.7],[90.7,91.18],[91.18,91.36],[91.36,91.7],[91.7,92.02],[92.02,92.36],[92.68,92.86],[92.86,93.12],[93.12,93.4],[93.4,93.84],[93.84,94.26],[94.26,94.58],[94.58,95.18],[95.62,95.76],[95.76,96.1],[96.1,96.48],[96.48,96.72],[96.72,97.1],[97.74,97.92],[97.92,98.22],[98.22,98.76],[98.76,99.02],[99.02,99.32],[99.32,99.64],[99.64,100.1],[100.1,100.38],[100.38,100.68],[100.68,100.92],[100.92,101.16],[101.16,101.58],[101.58,102],[102.66,102.84],[102.84,103.02],[103.02,103.38],[103.38,103.66],[103.66,104.04],[104.04,104.34],[104.34,104.56],[104.56,104.86],[104.86,105.26],[105.26,105.6],[105.6,105.65],[105.65,105.92],[105.92,106.12],[106.12,106.26],[106.26,106.52],[106.52,107.12],[107.5,107.7],[107.7,108.12],[108.12,108.48],[108.48,108.82],[108.82,109.06],[109.06,109.7],[109.7,110.01],[110.01,110.32],[110.32,110.74],[110.74,111.56],[111.56,111.92],[111.92,112.1],[112.1,112.6],[112.6,112.96],[112.96,113.18],[113.18,113.7],[113.7,113.73],[113.73,114.04],[114.46,114.72],[114.72,115.02],[115.02,115.6],[115.6,115.94],[115.94,116.28],[116.28,116.6],[116.6,117.08],[117.08,117.4],[117.4,117.7],[118.44,118.68],[118.68,118.98],[118.98,119.38],[119.38,119.84],[119.84,120.1],[120.1,120.9],[120.9,121.06],[121.06,121.46],[121.46,121.82],[121.82,122.28],[122.28,122.54],[122.54,122.84],[122.84,123.24],[123.24,123.84],[123.84,124.4],[124.4,124.7],[124.7,125.08]]
        },
        "title": "第二列",
        "theme": {
          "zh": "海岛守卫",
          "en": "A Coastal Nation Resists Embargo"
        },
        "words": [
          {
            "id": "s4col2-hospitality",
            "word": "hospitality",
            "pos": "n.",
            "meaning": "好客；殷勤"
          },
          {
            "id": "s4col2-vacant",
            "word": "vacant",
            "pos": "adj.",
            "meaning": "空的；空置的"
          },
          {
            "id": "s4col2-integral",
            "word": "integral",
            "pos": "adj.",
            "meaning": "不可或缺的；基本的"
          },
          {
            "id": "s4col2-merit",
            "word": "merit",
            "pos": "n.",
            "meaning": "价值；优点"
          },
          {
            "id": "s4col2-orientation",
            "word": "orientation",
            "pos": "n.",
            "meaning": "方向；定位"
          },
          {
            "id": "s4col2-patrol",
            "word": "patrol",
            "pos": "v.",
            "meaning": "巡逻"
          },
          {
            "id": "s4col2-brochure",
            "word": "brochure",
            "pos": "n.",
            "meaning": "小册子"
          },
          {
            "id": "s4col2-intrinsic",
            "word": "intrinsic",
            "pos": "adj.",
            "meaning": "内在的；本质的"
          },
          {
            "id": "s4col2-slump",
            "word": "slump",
            "pos": "n.",
            "meaning": "萧条；暴跌"
          },
          {
            "id": "s4col2-enact",
            "word": "enact",
            "pos": "v.",
            "meaning": "制定；颁布"
          },
          {
            "id": "s4col2-assault",
            "word": "assault",
            "pos": "n.",
            "meaning": "袭击；攻击"
          },
          {
            "id": "s4col2-embargo",
            "word": "embargo",
            "pos": "n.",
            "meaning": "禁运；贸易封锁"
          },
          {
            "id": "s4col2-envisage",
            "word": "envisage",
            "pos": "v.",
            "meaning": "设想；预见"
          },
          {
            "id": "s4col2-gale",
            "word": "gale",
            "pos": "n.",
            "meaning": "大风；狂风"
          },
          {
            "id": "s4col2-restrain",
            "word": "restrain",
            "pos": "v.",
            "meaning": "抑制；克制"
          },
          {
            "id": "s4col2-durable",
            "word": "durable",
            "pos": "adj.",
            "meaning": "持久的；耐久的"
          },
          {
            "id": "s4col2-allure",
            "word": "allure",
            "pos": "n.",
            "meaning": "诱惑力；魅力"
          },
          {
            "id": "s4col2-ordeal",
            "word": "ordeal",
            "pos": "n.",
            "meaning": "煎熬；严酷考验"
          },
          {
            "id": "s4col2-allege",
            "word": "allege",
            "pos": "v.",
            "meaning": "声称；断言"
          },
          {
            "id": "s4col2-furious",
            "word": "furious",
            "pos": "adj.",
            "meaning": "猛烈的；狂怒的"
          },
          {
            "id": "s4col2-deduction",
            "word": "deduction",
            "pos": "n.",
            "meaning": "推断；演绎"
          },
          {
            "id": "s4col2-turmoil",
            "word": "turmoil",
            "pos": "n.",
            "meaning": "动荡；混乱"
          },
          {
            "id": "s4col2-credential",
            "word": "credential",
            "pos": "n.",
            "meaning": "资历；凭据"
          },
          {
            "id": "s4col2-unleash",
            "word": "unleash",
            "pos": "v.",
            "meaning": "释放；发动"
          },
          {
            "id": "s4col2-fallacy",
            "word": "fallacy",
            "pos": "n.",
            "meaning": "谬论；谬误"
          },
          {
            "id": "s4col2-undernourished",
            "word": "undernourished",
            "pos": "adj.",
            "meaning": "营养不良的"
          },
          {
            "id": "s4col2-cereal",
            "word": "cereal",
            "pos": "n.",
            "meaning": "谷物"
          },
          {
            "id": "s4col2-whip",
            "word": "whip",
            "pos": "v.",
            "meaning": "驱使；鞭策"
          },
          {
            "id": "s4col2-evade",
            "word": "evade",
            "pos": "v.",
            "meaning": "躲避；规避"
          },
          {
            "id": "s4col2-ingenious",
            "word": "ingenious",
            "pos": "adj.",
            "meaning": "巧妙的；独创的"
          },
          {
            "id": "s4col2-ardently",
            "word": "ardently",
            "pos": "adv.",
            "meaning": "热烈地；热切地"
          },
          {
            "id": "s4col2-irony",
            "word": "irony",
            "pos": "n.",
            "meaning": "讽刺；反讽"
          },
          {
            "id": "s4col2-bolster",
            "word": "bolster",
            "pos": "v.",
            "meaning": "支撑；增强"
          }
        ],
        "paragraphs": [
          {
            "id": "s4col2-p1",
            "segments": [
              "When the hostile empire declared an ",
              {
                "vocabId": "s4col2-embargo",
                "text": "embargo"
              },
              " on the island republic of Marindel, few could ",
              {
                "vocabId": "s4col2-envisage",
                "text": "envisage"
              },
              " the ",
              {
                "vocabId": "s4col2-ordeal",
                "text": "ordeal"
              },
              " that would follow. Warships began to ",
              {
                "vocabId": "s4col2-patrol",
                "text": "patrol"
              },
              " the harbors, and a sudden ",
              {
                "vocabId": "s4col2-assault",
                "text": "assault"
              },
              " on the coastal batteries left many homes ",
              {
                "vocabId": "s4col2-vacant",
                "text": "vacant"
              },
              ", their families fled inland. The invaders ",
              {
                "vocabId": "s4col2-allege",
                "text": "allege"
              },
              " that Marindel had provoked the conflict, but this was a ",
              {
                "vocabId": "s4col2-fallacy",
                "text": "fallacy"
              },
              " woven from propaganda."
            ],
            "analysis": {
              "translation": "当敌对帝国对岛屿共和国马林德尔宣布禁运时，很少有人能设想随之而来的磨难。军舰开始在港口巡逻，对海岸炮台的突然袭击使许多房屋空置，其家庭逃往内陆。入侵者声称马林德尔挑起了冲突，但这不过是由宣传编织而成的谬论。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当敌对帝国对岛屿共和国马林德尔宣布禁运时，很少有人…” → “军舰开始在港口巡逻，对海岸炮台的突然袭击使许多房屋…” → “入侵者声称马林德尔挑起了冲突，但这不过是由宣传编织…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">时间状语从句</span>：When the hostile empire declared an embargo on...，由When引导。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">declare an embargo on</span> 对……宣布禁运，embargo意为“禁运、贸易封锁”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that would follow 修饰ordeal，that作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">envisage</span> 设想、预见，few could envisage the ordeal 表示“很少有人能设想这场磨难”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">leave + 宾语 + 宾补</span>：left many homes vacant，vacant为形容词作宾语补足语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">独立主格结构</span>：their families fled inland，名词+过去分词（fled为不及物动词过去式），表伴随状况。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that Marindel had provoked the conflict 作allege的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">woven from propaganda</span> 过去分词短语作后置定语修饰fallacy，表示“由宣传编织的谬论”。",
                "<span class=\"keyword\">语境搭配</span>：embargo 出现在“declared an embargo on the island”中，本段取“禁运”义；envisage 出现在“few could envisage the ordeal that”中，本段取“设想”义；ordeal 出现在“envisage the ordeal that would follow”中，本段取“煎熬”义；patrol 出现在“began to patrol the harbors”中，本段取“巡逻”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col2-p2",
            "segments": [
              "The ",
              {
                "vocabId": "s4col2-irony",
                "text": "irony"
              },
              " was bitter: Marindel had long been famous for its ",
              {
                "vocabId": "s4col2-hospitality",
                "text": "hospitality"
              },
              " toward foreign merchants. Now, with trade severed, the economy fell into a ",
              {
                "vocabId": "s4col2-slump",
                "text": "slump"
              },
              ", and the people grew ",
              {
                "vocabId": "s4col2-undernourished",
                "text": "undernourished"
              },
              " on meager rations of ",
              {
                "vocabId": "s4col2-cereal",
                "text": "cereal"
              },
              " and dried fish. The ",
              {
                "vocabId": "s4col2-turmoil",
                "text": "turmoil"
              },
              " seemed insurmountable. Yet the islanders refused to surrender; they ",
              {
                "vocabId": "s4col2-ardently",
                "text": "ardently"
              },
              " believed their freedom had ",
              {
                "vocabId": "s4col2-intrinsic",
                "text": "intrinsic"
              },
              " worth beyond any treaty's ",
              {
                "vocabId": "s4col2-merit",
                "text": "merit"
              },
              "."
            ],
            "analysis": {
              "translation": "这种讽刺令人苦涩：马林德尔长期以来一直以对外国商人的好客而闻名。如今，随着贸易被切断，经济陷入衰退，人民靠着谷物和干鱼的微薄配给变得营养不良。动乱似乎不可克服。然而岛民拒绝投降；他们热切地相信自己的自由具有超越任何条约价值的内在价值。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这种讽刺令人苦涩：马林德尔长期以来一直以对外国商人…” → “动乱似乎不可克服” → “岛民拒绝投降” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The irony was bitter\"，冒号后为同位语解释说明irony的内容。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">be famous for</span> 因……而闻名，had long been famous for its hospitality 表示“长期以来以好客闻名”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">with + 宾语 + 宾补</span>：with trade severed 为with复合结构作原因/伴随状语，severed为过去分词作宾补。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">fall into a slump</span> 陷入衰退/萧条，slump意为“衰退、暴跌”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">grow + 形容词</span>：grew undernourished，grow为系动词后接形容词作表语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">on meager rations</span> 靠微薄的配给，介词on表示“依靠……”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">insurmountable</span> 不可克服的、不可逾越的，前缀in-+surmount+able。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：(that) their freedom had intrinsic worth beyond any treaty's merit 作believed的宾语，省略了that，intrinsic worth 意为“内在价值”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：irony 出现在“The irony was bitter”中，本段取“讽刺”义；hospitality 出现在“for its hospitality toward foreign merchants”中，本段取“好客”义；slump 出现在“into a slump”中，本段取“萧条”义；undernourished 出现在“people grew undernourished on meager rations”中，本段取“营养不良的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col2-p3",
            "segments": [
              "General Lira, whose ",
              {
                "vocabId": "s4col2-credential",
                "text": "credential"
              },
              " as a strategist was unmatched, understood that ",
              {
                "vocabId": "s4col2-durable",
                "text": "durable"
              },
              " resistance required ",
              {
                "vocabId": "s4col2-ingenious",
                "text": "ingenious"
              },
              " tactics rather than brute force. She reorganized the militia's ",
              {
                "vocabId": "s4col2-orientation",
                "text": "orientation"
              },
              " toward guerrilla defense, using the rocky coves and ",
              {
                "vocabId": "s4col2-gale",
                "text": "gale"
              },
              "-swept channels to ",
              {
                "vocabId": "s4col2-evade",
                "text": "evade"
              },
              " the enemy's superior firepower. When the empire tried to ",
              {
                "vocabId": "s4col2-whip",
                "text": "whip"
              },
              " its troops into a ",
              {
                "vocabId": "s4col2-furious",
                "text": "furious"
              },
              " offensive, Lira's fighters would strike supply lines and vanish into the fog."
            ],
            "analysis": {
              "translation": "利拉将军——作为战略家她的资历无人能及——明白持久的抵抗需要巧妙的战术而非蛮力。她将民兵的防线调整为游击防御，利用岩石密布的海湾和狂风扫过的水道来规避敌人优势的火力。当帝国试图将其部队驱使成猛烈的攻势时，利拉的战士们会打击补给线然后消失在雾中。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “利拉将军——作为战略家她的资历无人能及——明白持久…” → “她将民兵的防线调整为游击防御，利用岩石密布的海湾和…” → “当帝国试图将其部队驱使成猛烈的攻势时，利拉的战士们…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">非限制性定语从句</span>：whose credential as a strategist was unmatched 修饰General Lira，whose作定语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that durable resistance required ingenious tactics rather than brute force 作understood的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">rather than</span> 而不是，ingenious tactics rather than brute force 表示“巧妙战术而非蛮力”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语using the rocky coves... to evade the enemy's superior firepower作方式状语，其中to evade为目的状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">reorient... toward</span> 将……调整为/转向……，reorganized the militia's orientation toward guerrilla defense。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：When the empire tried to whip its troops into a furious offensive，由When引导。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">whip... into...</span> 将……驱使成……，whip its troops into a furious offensive 意为“将部队驱使成猛烈攻势”。",
                "<span class=\"keyword\">逻辑衔接</span>：would strike... and vanish... 为并列谓语，would表过去经常性动作。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">语境搭配</span>：credential 出现在“whose credential as a strategist”中，本段取“资历”义；durable 出现在“understood that durable resistance required ingenious”中，本段取“持久的”义；ingenious 出现在“resistance required ingenious tactics rather than”中，本段取“巧妙的”义；orientation 出现在“the militia's orientation toward guerrilla defense”中，本段取“方向”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col2-p4",
            "segments": [
              "To ",
              {
                "vocabId": "s4col2-bolster",
                "text": "bolster"
              },
              " morale, the resistance council distributed a simple printed ",
              {
                "vocabId": "s4col2-brochure",
                "text": "brochure"
              },
              " outlining survival strategies and rationing schedules—a small document that became ",
              {
                "vocabId": "s4col2-integral",
                "text": "integral"
              },
              " to every household. Citizens learned to ",
              {
                "vocabId": "s4col2-restrain",
                "text": "restrain"
              },
              " their fear, and through calm ",
              {
                "vocabId": "s4col2-deduction",
                "text": "deduction"
              },
              " of intercepted messages, they predicted each new attack."
            ],
            "analysis": {
              "translation": "为了提振士气，抵抗委员会分发了一本简单的印刷小册子，概述了生存策略和配给时间表——这份小文件成了每个家庭不可或缺的东西。市民们学会了克制恐惧，通过冷静推断截获的信息，他们预测了每一次新的攻击。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “为了提振士气，抵抗委员会分发了一本简单的印刷小册子…” → “市民们学会了克制恐惧，通过冷静推断截获的信息，他们…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">目的状语</span>：To bolster morale 为不定式短语作目的状语，意为“为了提振士气”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">bolster</span> 提升、增强，bolster morale 意为“提振士气”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语outlining survival strategies and rationing schedules作后置定语，修饰brochure。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that became integral to every household 修饰document，that作主语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">be integral to</span> 对……不可或缺的，became integral to every household 表示“成为每个家庭不可或缺的”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">restrain</span> 克制、抑制，learned to restrain their fear 意为“学会克制恐惧”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">through calm deduction of</span> 通过冷静推断……，through引导方式状语。",
                "<span class=\"keyword\">句子骨架</span>：该句由and连接两个并列分句，主干为\"Citizens learned to restrain their fear, and... they predicted each new attack\"。",
                "<span class=\"keyword\">语境搭配</span>：bolster 出现在“To bolster morale”中，本段取“支撑”义；brochure 出现在“simple printed brochure outlining survival strategies”中，本段取“小册子”义；integral 出现在“that became integral to every household”中，本段取“不可或缺的”义；restrain 出现在“learned to restrain their fear”中，本段取“抑制”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col2-p5",
            "segments": [
              "The invaders believed they could ",
              {
                "vocabId": "s4col2-unleash",
                "text": "unleash"
              },
              " enough pressure to break the republic's spirit. They could not comprehend the ",
              {
                "vocabId": "s4col2-allure",
                "text": "allure"
              },
              " that liberty held for a people who had tasted it. Season after season, through storm and hunger, Marindel endured. When the empire finally agreed to ",
              {
                "vocabId": "s4col2-enact",
                "text": "enact"
              },
              " a ceasefire, the world recognized that courage and cleverness had prevailed. The island stood scarred but sovereign—a testament that resilience, when rooted in purpose, can outlast any siege."
            ],
            "analysis": {
              "translation": "入侵者相信他们能施加大足够的压力来摧毁这个共和国的精神。他们无法理解自由对一个尝过自由滋味的民族所具有的吸引力。一个季节接一个季节，穿越风暴与饥饿，马林德尔坚持了下来。当帝国最终同意实施停火时，全世界认识到勇气和智慧已经获胜。这座岛屿满身伤痕但主权独立——一个证明：当韧性扎根于目标之中时，它能够比任何围困更持久。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “入侵者相信他们能施加大足够的压力来摧毁这个共和国的…” → “一个季节接一个季节，穿越风暴与饥饿，马林德尔坚持了…” → “这座岛屿满身伤痕但主权独立——一个证明：当韧性扎根…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">宾语从句</span>：(that) they could unleash enough pressure to break the republic's spirit 作believed的宾语，省略了that。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">unleash</span> 释放、发动，unleash enough pressure 意为“施加足够的压力”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">enough... to...</span> 结构：enough pressure to break the republic's spirit，不定式作结果状语。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that liberty held for a people who had tasted it 修饰allure，that作held的宾语（宾语前置）。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">嵌套定语从句</span>：who had tasted it 修饰a people，who作主语，it指代liberty。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：When the empire finally agreed to enact a ceasefire，由When引导。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that courage and cleverness had prevailed 作recognized的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">插入语/时间状语</span>：when rooted in purpose 为when+过去分词的省略结构，相当于when resilience is rooted in purpose，修饰resilience。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：unleash 出现在“they could unleash enough pressure to”中，本段取“释放”义；allure 出现在“comprehend the allure that liberty held”中，本段取“诱惑力”义；enact 出现在“agreed to enact a ceasefire”中，本段取“制定”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s4col3",
        "number": 3,
        "audio": {
          "src": "audio/list4_col3.mp3",
          "cues": [[3.44,3.52],[3.52,3.76],[3.76,4.08],[4.08,4.52],[4.52,4.86],[4.86,4.91],[4.91,5.4],[5.4,5.68],null,[6.38,6.56],[6.56,6.68],[6.68,7.04],[7.04,7.26],[7.26,7.58],[7.58,7.78],[7.78,8.3],[8.3,8.56],[8.56,8.76],[8.76,8.9],[8.9,9.22],[9.22,9.52],[9.52,9.78],[9.78,10.04],[10.04,10.38],[10.38,10.68],[10.68,11.12],[11.9,12.04],[12.04,12.58],[12.58,12.6],[12.6,12.74],[12.74,13.06],[13.06,13.48],[13.48,13.64],[13.64,13.84],[13.84,14.3],[14.3,14.52],[14.52,14.7],[14.7,14.9],[14.9,15.26],[15.26,15.66],[15.66,15.94],[15.94,16.4],null,[17.14,17.22],[17.22,17.78],[17.78,18.3],[18.3,18.64],[18.64,18.98],[18.98,19.14],[19.14,19.58],[20.42,20.52],[20.52,20.62],[20.62,20.84],[20.84,21.1],[21.1,21.64],[21.64,22.12],[22.12,22.42],[22.42,22.8],[22.8,23.12],[23.68,24.02],[24.02,24.4],[24.4,24.74],[24.74,25.1],[25.1,25.32],[25.32,25.56],[25.56,26.2],[26.2,26.38],[26.38,26.66],[26.66,27.1],[27.74,28.08],[28.08,28.38],[28.38,28.6],[28.6,28.78],[28.78,29.18],[29.18,29.58],[29.58,29.76],[29.76,30.08],[30.08,30.64],[30.64,30.94],[30.94,31.14],[31.62,31.98],[31.98,32.22],[32.22,32.58],null,[33.46,33.52],[33.52,33.78],[33.78,34.1],[34.1,34.38],[34.38,34.64],[34.64,35],[35,35.22],[35.22,35.82],null,[36.2,36.5],[36.5,36.82],[36.82,37.16],[37.16,37.56],[38.36,38.46],[38.46,38.62],[38.62,39.02],[39.02,39.2],[39.2,39.44],[39.44,39.84],[39.84,40.06],[40.06,40.44],[41.04,41.18],[41.18,41.74],[41.74,41.8],[41.8,42.08],[42.08,42.44],[42.44,42.92],[42.92,42.95],[42.95,43.14],[43.14,43.52],[44.8,44.82],[44.82,45.12],[45.12,45.15],[45.15,45.3],[45.3,45.68],[45.68,46.12],[46.12,46.28],[46.28,46.44],[46.44,46.72],[47.26,47.28],[47.28,47.64],[47.64,47.9],[47.9,48.26],[48.26,48.56],[48.56,48.92],[48.92,49.14],[50.26,50.28],[50.28,50.44],[50.44,50.74],[50.74,51.08],[51.08,51.52],[51.52,51.86],null,[52.42,52.7],[52.7,52.98],[52.98,53.52],[53.52,53.74],[53.74,53.98],[53.98,54.3],null,[54.72,54.78],[54.78,55.08],[55.08,55.4],[55.4,55.58],[55.58,55.84],[55.84,56.08],[56.08,56.32],[56.32,56.46],[56.46,56.76],null,[57.16,57.68],[57.68,57.71],[57.71,57.96],[57.96,58.52],[59.3,59.4],[59.4,59.86],[59.86,60.16],[60.16,60.34],[60.34,60.7],[60.7,60.98],[60.98,61.4],[61.4,61.68],[61.68,62.18],[62.18,62.48],[62.96,63.1],[63.1,63.24],[63.24,63.4],[63.4,63.6],[63.6,63.96],[63.96,64.2],[64.2,64.44],[64.44,64.78],[64.78,64.98],[64.98,65.24],[65.24,65.68],[65.68,65.88],[65.88,66.2],[66.2,66.5],[66.5,66.92],[66.92,67.12],[67.12,67.38],[68.32,68.46],[68.46,68.66],[68.66,69.08],[69.08,69.34],[69.34,69.66],[69.66,69.76],[69.76,70.04],[70.04,70.44],[70.44,70.58],[70.58,71],[71.52,71.76],[71.76,72.12],[72.12,72.36],[72.36,72.74],[72.74,73.1],[73.1,73.22],[73.22,73.46],[73.46,73.74],[73.74,74.1],[74.1,74.48],[74.48,74.64],[74.64,74.92],[74.92,75.28],null,[76.38,76.58],[76.58,76.9],[76.9,77.12],[77.12,77.3],[77.3,77.54],[77.54,77.7],[77.7,77.92],[78.46,78.74],[78.74,78.9],[78.9,79.02],[79.02,79.18],[79.18,79.5],[79.5,79.74],[79.74,80.08],[80.08,80.32],[80.32,80.54],[80.54,80.82],[80.82,81.3],[81.3,81.56],[81.56,81.78],[82.82,83.02],[83.02,83.04],[83.04,83.2],[83.2,83.68],[83.68,84.08],[84.08,84.28],[84.28,84.76],[84.76,85.04],[85.04,85.6],[85.6,85.78],[85.78,86.06],[86.06,86.9],[86.9,87.48],[88.12,88.32],[88.32,89.08],[89.08,89.12],[89.12,89.34],[89.34,89.72],[89.72,90.48],[90.48,90.92],[90.92,91.18],[91.18,91.58],[91.58,91.76],[91.76,92.14],[92.92,93.02],[93.02,93.32],[93.32,93.7],[93.7,93.84],[93.84,94.88],null,[94.88,94.93],[94.93,95.2],[95.2,95.4],[95.4,95.66],[95.66,96.08],[96.08,96.58],null,[97.08,97.36],[97.36,97.7],[97.7,98.02],[98.02,98.26],[98.26,98.48],[99.42,99.6],[99.6,99.8],[99.8,99.96],[99.96,100.12],[100.12,100.54],[100.54,100.7],[100.7,101.02],[101.02,101.18],[101.18,101.42],[102.32,102.52],[102.52,102.72],[102.72,103.04],[103.04,103.28],[103.28,103.4],[103.4,103.64],[104.41,104.72],[104.72,104.82],[104.82,104.98],[104.98,105.46],[105.94,106.08],[106.08,106.58],[106.58,106.98],[106.98,107.34],[107.34,107.5],[107.5,107.6],[107.6,107.88],[108.44,108.5],[108.5,108.74],[108.74,109.26],[109.26,109.31],[109.31,109.56],[109.76,110.08],[110.08,110.18],[110.18,110.48],[110.48,110.88],[110.88,111.14],[111.14,111.56],[111.56,111.94]]
        },
        "title": "第三列",
        "theme": {
          "zh": "艺术寻觅",
          "en": "An Artist Seeks Eternal Truth Through Carpentry"
        },
        "words": [
          {
            "id": "s4col3-depiction",
            "word": "depiction",
            "pos": "n.",
            "meaning": "描绘；描写"
          },
          {
            "id": "s4col3-wither",
            "word": "wither",
            "pos": "v.",
            "meaning": "枯萎；凋谢"
          },
          {
            "id": "s4col3-startling",
            "word": "startling",
            "pos": "adj.",
            "meaning": "令人吃惊的"
          },
          {
            "id": "s4col3-eternal",
            "word": "eternal",
            "pos": "adj.",
            "meaning": "永恒的"
          },
          {
            "id": "s4col3-crave",
            "word": "crave",
            "pos": "v.",
            "meaning": "渴望"
          },
          {
            "id": "s4col3-divert",
            "word": "divert",
            "pos": "v.",
            "meaning": "转移"
          },
          {
            "id": "s4col3-blunt",
            "word": "blunt",
            "pos": "adj.",
            "meaning": "钝的；不锋利的"
          },
          {
            "id": "s4col3-penetrate",
            "word": "penetrate",
            "pos": "v.",
            "meaning": "穿透；透过"
          },
          {
            "id": "s4col3-insulate",
            "word": "insulate",
            "pos": "v.",
            "meaning": "隔离；使隔绝"
          },
          {
            "id": "s4col3-parameter",
            "word": "parameter",
            "pos": "n.",
            "meaning": "参数；界限"
          },
          {
            "id": "s4col3-reimburse",
            "word": "reimburse",
            "pos": "v.",
            "meaning": "偿还；报销"
          },
          {
            "id": "s4col3-surrender",
            "word": "surrender",
            "pos": "v.",
            "meaning": "屈服；投降"
          },
          {
            "id": "s4col3-hamper",
            "word": "hamper",
            "pos": "v.",
            "meaning": "阻碍；妨碍"
          },
          {
            "id": "s4col3-stagnation",
            "word": "stagnation",
            "pos": "n.",
            "meaning": "停滞"
          },
          {
            "id": "s4col3-overlap",
            "word": "overlap",
            "pos": "n.",
            "meaning": "重叠；交集"
          },
          {
            "id": "s4col3-swamp",
            "word": "swamp",
            "pos": "v.",
            "meaning": "淹没；使应接不暇"
          },
          {
            "id": "s4col3-recede",
            "word": "recede",
            "pos": "v.",
            "meaning": "退去；消退"
          },
          {
            "id": "s4col3-avert",
            "word": "avert",
            "pos": "v.",
            "meaning": "避开；转移"
          },
          {
            "id": "s4col3-utter",
            "word": "utter",
            "pos": "adj.",
            "meaning": "完全的；彻底的"
          },
          {
            "id": "s4col3-sensational",
            "word": "sensational",
            "pos": "adj.",
            "meaning": "轰动的；耸人听闻的"
          },
          {
            "id": "s4col3-rehearsal",
            "word": "rehearsal",
            "pos": "n.",
            "meaning": "排练；预演"
          },
          {
            "id": "s4col3-casualty",
            "word": "casualty",
            "pos": "n.",
            "meaning": "受害者；牺牲品"
          },
          {
            "id": "s4col3-haunt",
            "word": "haunt",
            "pos": "v.",
            "meaning": "困扰；萦绕"
          },
          {
            "id": "s4col3-rivalry",
            "word": "rivalry",
            "pos": "n.",
            "meaning": "竞争；对抗"
          },
          {
            "id": "s4col3-carpentry",
            "word": "carpentry",
            "pos": "n.",
            "meaning": "木工；木匠活"
          },
          {
            "id": "s4col3-offspring",
            "word": "offspring",
            "pos": "n.",
            "meaning": "产物；后代"
          },
          {
            "id": "s4col3-discern",
            "word": "discern",
            "pos": "v.",
            "meaning": "辨别；识别"
          },
          {
            "id": "s4col3-ditch",
            "word": "ditch",
            "pos": "v.",
            "meaning": "抛弃；丢弃"
          },
          {
            "id": "s4col3-brisk",
            "word": "brisk",
            "pos": "adj.",
            "meaning": "轻快的；利落的"
          },
          {
            "id": "s4col3-peninsula",
            "word": "peninsula",
            "pos": "n.",
            "meaning": "半岛"
          },
          {
            "id": "s4col3-discrepancy",
            "word": "discrepancy",
            "pos": "n.",
            "meaning": "差异；不一致"
          }
        ],
        "paragraphs": [
          {
            "id": "s4col3-p1",
            "segments": [
              "The artist Marcus lived on a windswept ",
              {
                "vocabId": "s4col3-peninsula",
                "text": "peninsula"
              },
              ", where the sea's roar could not ",
              {
                "vocabId": "s4col3-insulate",
                "text": "insulate"
              },
              " him from the memories that ",
              {
                "vocabId": "s4col3-haunt",
                "text": "haunt"
              },
              " his every waking hour. For years, a bitter ",
              {
                "vocabId": "s4col3-rivalry",
                "text": "rivalry"
              },
              " with his former mentor had left him paralyzed in creative ",
              {
                "vocabId": "s4col3-stagnation",
                "text": "stagnation"
              },
              ", his once-vivid canvases reduced to gray smears. He would watch his inspiration ",
              {
                "vocabId": "s4col3-wither",
                "text": "wither"
              },
              " like autumn leaves, unable to ",
              {
                "vocabId": "s4col3-penetrate",
                "text": "penetrate"
              },
              " the wall of self-doubt that surrounded him."
            ],
            "analysis": {
              "translation": "艺术家马库斯住在一个风扫的半岛上，那里大海的咆哮无法使他免受那些困扰他每个清醒时刻的记忆的侵扰。多年来，与前导师的痛苦竞争让他陷入创作停滞的瘫痪状态，他曾经鲜艳的画布沦为灰色的涂抹。他会看着自己的灵感像秋叶般枯萎，无法穿透那堵包围着他的自我怀疑之墙。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “艺术家马库斯住在一个风扫的半岛上，那里大海的咆哮无…” → “多年来，与前导师的痛苦竞争让他陷入创作停滞的瘫痪状…” → “他会看着自己的灵感像秋叶般枯萎，无法穿透那堵包围着…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">非限制性定语从句</span>：where the sea's roar could not insulate him from the memories 修饰peninsula，where作地点状语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">insulate... from...</span> 使……与……隔离/隔绝，could not insulate him from the memories 意为“无法使他免受记忆侵扰”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that haunt his every waking hour 修饰memories，that作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">leave + 宾语 + 宾补</span>：had left him paralyzed in creative stagnation，paralyzed为过去分词作宾语补足语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">独立主格结构</span>：his once-vivid canvases reduced to gray smears，名词+过去分词，表伴随状况。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">wither</span> 枯萎、衰退，watch his inspiration wither 中wither为宾语补足语。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">明喻</span>：wither like autumn leaves，用like构成明喻，将灵感枯竭比作秋叶凋零。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that surrounded him 修饰wall of self-doubt，that作主语。",
                "<span class=\"keyword\">语境搭配</span>：peninsula 出现在“a windswept peninsula”中，本段取“半岛”义；insulate 出现在“could not insulate him from the”中，本段取“隔离”义；haunt 出现在“memories that haunt his every waking”中，本段取“困扰”义；rivalry 出现在“a bitter rivalry with his former”中，本段取“竞争”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col3-p2",
            "segments": [
              "Marcus came to ",
              {
                "vocabId": "s4col3-crave",
                "text": "crave"
              },
              " something beyond the ",
              {
                "vocabId": "s4col3-sensational",
                "text": "sensational"
              },
              " praise of critics, something more ",
              {
                "vocabId": "s4col3-eternal",
                "text": "eternal"
              },
              ". He decided to ",
              {
                "vocabId": "s4col3-divert",
                "text": "divert"
              },
              " his energy into ",
              {
                "vocabId": "s4col3-carpentry",
                "text": "carpentry"
              },
              ", trading brushes for chisels. The ",
              {
                "vocabId": "s4col3-brisk",
                "text": "brisk"
              },
              " rhythm of shaving wood felt honest, each stroke a quiet ",
              {
                "vocabId": "s4col3-rehearsal",
                "text": "rehearsal"
              },
              " for a greater masterpiece. He set a strict ",
              {
                "vocabId": "s4col3-parameter",
                "text": "parameter"
              },
              " for his new work: every piece must ",
              {
                "vocabId": "s4col3-discern",
                "text": "discern"
              },
              " truth from vanity."
            ],
            "analysis": {
              "translation": "马库斯开始渴望某种超越评论家哗众取宠的赞美之外的东西，某种更永恒的东西。他决定将自己的精力转向木工，放下画笔拿起凿子。刨削木头的轻快节奏感觉很诚实，每一刀都是为更伟大杰作的静默排练。他为自己的新工作设定了一个严格的准则：每一件作品都必须辨别真相与虚荣。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “马库斯开始渴望某种超越评论家哗众取宠的赞美之外的东…” → “刨削木头的轻快节奏感觉很诚实，每一刀都是为更伟大杰…” → “他为自己的新工作设定了一个严格的准则：每一件作品都…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">come to do sth.</span> 逐渐开始做某事，came to crave 表示“逐渐开始渴望”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">crave</span> 渴望、热切要求，crave something beyond... 意为“渴望……之外的东西”。",
                "<span class=\"keyword\">结构拆解</span>：something more eternal为something beyond...的同位语，进一步说明所渴望之物。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">divert... into...</span> 将……转向……，divert his energy into carpentry 表示“将精力转向木工”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语trading brushes for chisels作伴随状语，表示“以画笔换凿子”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">trade A for B</span> 以A换取B，trading brushes for chisels 意为“放下画笔拿起凿子”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">独立主格结构</span>：each stroke a quiet rehearsal for a greater masterpiece，名词+名词短语，表伴随。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">discern A from B</span> 辨别A与B，must discern truth from vanity 意为“必须辨别真相与虚荣”。",
                "<span class=\"keyword\">语境搭配</span>：crave 出现在“came to crave something beyond the”中，本段取“渴望”义；sensational 出现在“beyond the sensational praise of critics”中，本段取“轰动的”义；eternal 出现在“something more eternal”中，本段取“永恒的”义；divert 出现在“decided to divert his energy into”中，本段取“转移”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col3-p3",
            "segments": [
              "Yet old habits refused to ",
              {
                "vocabId": "s4col3-recede",
                "text": "recede"
              },
              ". The ",
              {
                "vocabId": "s4col3-overlap",
                "text": "overlap"
              },
              " between his two crafts — the ",
              {
                "vocabId": "s4col3-depiction",
                "text": "depiction"
              },
              " of life in wood and in paint — produced a ",
              {
                "vocabId": "s4col3-startling",
                "text": "startling"
              },
              " result. His carvings began to capture emotion his paintings never could, as if the ",
              {
                "vocabId": "s4col3-blunt",
                "text": "blunt"
              },
              " grain of oak could reach the viewer's heart more deeply than any pigment. He refused to ",
              {
                "vocabId": "s4col3-surrender",
                "text": "surrender"
              },
              " to the temptation of easy fame, avoiding the ",
              {
                "vocabId": "s4col3-utter",
                "text": "utter"
              },
              " collapse that had claimed his mentor as its first ",
              {
                "vocabId": "s4col3-casualty",
                "text": "casualty"
              },
              "."
            ],
            "analysis": {
              "translation": "然而旧习惯不肯消退。他两种手艺之间的重叠——在木头和颜料中对生命的描绘——产生了一个令人惊讶的结果。他的雕刻开始捕捉到他的画作永远无法捕捉的情感，仿佛橡木粗犷的纹理比任何颜料都能更深刻地触及观者的心灵。他拒绝屈服于轻易成名的诱惑，避免了那种曾将他的导师作为第一个牺牲品的彻底崩溃。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “旧习惯不肯消退” → “他的雕刻开始捕捉到他的画作永远无法捕捉的情感，仿佛…” → “他拒绝屈服于轻易成名的诱惑，避免了那种曾将他的导师…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"old habits refused to recede\"，<span class=\"keyword\">recede</span> 消退、退去，refused to recede 意为“拒绝消退”。",
                "<span class=\"keyword\">逻辑衔接</span>：破折号内the depiction of life in wood and in paint为overlap的同位语/解释说明。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句（省略that）</span>：(that) his paintings never could 修饰emotion，省略了关系代词that/which。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">方式状语从句</span>：as if the blunt grain of oak could reach the viewer's heart more deeply than any pigment，由as if引导，表虚拟。这里不是在补充事实，而是用类比或假设呈现人物感受，让画面和语气更鲜明。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">比较结构</span>：more deeply than any pigment，more...than...表示“比……更……”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">surrender to</span> 屈服于，refused to surrender to the temptation 表示“拒绝屈服于诱惑”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that had claimed his mentor as its first casualty 修饰collapse，that作主语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">claim... as...</span> 将……作为……夺走/索取，claimed his mentor as its first casualty 意为“将其导师作为第一个牺牲品夺走”。",
                "<span class=\"keyword\">语境搭配</span>：recede 出现在“refused to recede”中，本段取“退去”义；overlap 出现在“The overlap between his two”中，本段取“重叠”义；depiction 出现在“the depiction of life in”中，本段取“描绘”义；startling 出现在“produced a startling result”中，本段取“令人吃惊的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col3-p4",
            "segments": [
              "Critics tried to ",
              {
                "vocabId": "s4col3-swamp",
                "text": "swamp"
              },
              " him with commissions, but he would ",
              {
                "vocabId": "s4col3-avert",
                "text": "avert"
              },
              " their gaze and ",
              {
                "vocabId": "s4col3-ditch",
                "text": "ditch"
              },
              " the shallow projects they proposed. When a gallery owner offered to ",
              {
                "vocabId": "s4col3-reimburse",
                "text": "reimburse"
              },
              " him handsomely for quick, market-friendly pieces, Marcus noticed a sharp ",
              {
                "vocabId": "s4col3-discrepancy",
                "text": "discrepancy"
              },
              " between what sold and what mattered. The ",
              {
                "vocabId": "s4col3-offspring",
                "text": "offspring"
              },
              " of his solitude — a series of carved wooden figures — spoke louder than any canvas."
            ],
            "analysis": {
              "translation": "评论家们试图用委约订单将他淹没，但他会避开他们的目光，抛弃他们提出的浅薄项目。当一位画廊老板提出以丰厚报酬换取快速、迎合市场的作品时，马库斯注意到畅销之作与有意义的作品之间存在着尖锐的差异。他孤独的产物——一系列木雕人像——比任何画布都更有说服力。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “评论家们试图用委约订单将他淹没，但他会避开他们的目…” → “当一位画廊老板提出以丰厚报酬换取快速、迎合市场的作…” → “他孤独的产物——一系列木雕人像——比任何画布都更有…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">swamp... with...</span> 用……使……应接不暇/淹没，swamp him with commissions 意为“用委约订单淹没他”。",
                "<span class=\"keyword\">逻辑衔接</span>：该句由but连接两个并列分句，表转折关系。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">avert one's gaze</span> 移开目光、避开注视，would avert their gaze 表示“会避开他们的目光”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">ditch</span> 抛弃、丢弃，ditch the shallow projects 意为“抛弃浅薄的项目”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句（省略that）</span>：(that/which) they proposed 修饰projects，省略了关系代词。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：When a gallery owner offered to reimburse him handsomely...，由When引导。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">reimburse sb. for sth.</span> 为某事向某人偿付/报酬，reimburse him handsomely for quick, market-friendly pieces。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：what sold 和 what mattered 作between的宾语，what引导名词性从句，分别表示“畅销的”和“有意义的”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：swamp 出现在“tried to swamp him with commissions”中，本段取“淹没”义；avert 出现在“he would avert their gaze and”中，本段取“避开”义；ditch 出现在“gaze and ditch the shallow projects”中，本段取“抛弃”义；reimburse 出现在“offered to reimburse him handsomely for”中，本段取“偿还”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col3-p5",
            "segments": [
              "His work would not ",
              {
                "vocabId": "s4col3-hamper",
                "text": "hamper"
              },
              " the spirit with ornament; it stripped life to its bones. And in that simplicity, Marcus finally found what he had sought: not victory over a rival, but the quiet truth that outlasts applause."
            ],
            "analysis": {
              "translation": "他的作品不会用装饰来束缚精神；它将生命剥离到骨架。而在那种简约之中，马库斯终于找到了他所追寻的东西：不是对对手的胜利，而是比掌声更持久的静默真相。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他的作品不会用装饰来束缚精神” → “在那种简约之中，马库斯终于找到了他所追寻的东西：不…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">hamper... with...</span> 用……束缚/妨碍……，would not hamper the spirit with ornament 意为“不用装饰束缚精神”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">strip... to its bones</span> 剥到骨头/精简到极致，stripped life to its bones 为隐喻，表示“将生命剥离到本质”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：what he had sought 作found的宾语，what引导名词性从句。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">not... but...</span> 结构：not victory over a rival, but the quiet truth，表示“不是……而是……”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that outlasts applause 修饰truth，that作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">outlast</span> 比……更持久、比……活得长，outlasts applause 意为“比掌声更持久”。",
                "<span class=\"keyword\">语境搭配</span>：hamper 出现在“would not hamper the spirit with”中，本段取“阻碍”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s4col4",
        "number": 4,
        "audio": {
          "src": "audio/list4_col4.mp3",
          "cues": [[2.58,2.68],[2.68,2.86],[2.86,3.58],[3.58,3.8],[4.24,4.43],[4.43,4.62],[4.62,4.9],[4.9,5.34],[5.34,5.66],[5.66,5.92],[5.92,6.38],[6.38,6.66],[6.66,6.86],[6.86,7.26],[7.26,7.58],[7.58,8.12],[8.12,8.38],[8.38,8.62],[8.62,8.92],[10,10.12],[10.12,10.24],[10.24,10.4],[10.4,10.68],[10.68,10.9],[10.9,11.04],[11.04,11.4],[11.4,12.04],[12.64,13.14],[13.14,13.19],[13.19,13.4],[13.4,13.8],[13.8,14.32],[14.32,14.66],[14.66,15],[15,15.46],[15.46,15.76],[15.76,15.9],[15.9,16.32],[16.32,16.76],[16.76,17.02],[17.02,18.58],[18.58,18.61],[18.61,18.78],[18.78,19.04],[19.04,19.22],[19.22,19.46],[19.46,19.78],[19.78,20.18],[20.18,20.42],[20.42,20.62],[20.62,21],[21,21.26],[21.26,21.42],[21.42,21.72],[22.52,22.8],[22.8,22.84],[22.84,23.06],[23.26,23.34],[23.34,23.68],[23.68,24.08],[24.08,24.11],[24.11,24.36],[24.36,24.84],[24.84,25.18],[25.18,25.32],[25.32,25.54],[25.54,25.78],[25.78,26.06],[26.06,26.92],[26.92,27.14],[27.14,27.17],[27.17,27.36],[27.36,27.74],[27.74,27.94],[28.78,29.06],[29.06,29.38],[29.38,29.54],[29.54,29.88],[29.88,30.24],[30.24,30.5],[30.5,30.82],[30.82,30.98],[30.98,31.24],[31.24,31.58],[31.58,31.84],[31.84,32],[32,32.48],[33.02,33.26],[33.26,33.4],[33.4,33.58],[33.58,33.84],[33.84,34.18],[34.18,34.58],[34.58,34.7],[34.7,34.98],[34.98,35.34],[35.34,35.9],[35.9,35.94],[35.94,36.28],null,[37.18,37.32],[37.32,37.58],[37.58,37.98],[37.98,38.5],[38.5,38.55],[38.55,38.76],[38.76,39.02],[39.02,39.24],[39.24,39.38],[39.38,40.44],[40.44,40.49],[40.49,40.76],[40.76,41.04],[41.04,41.42],[41.42,41.64],[41.64,41.98],[41.98,42.38],[42.38,42.88],null,[43.42,43.64],[43.82,44.12],[44.12,44.46],[44.46,44.9],[44.9,45.26],[45.26,45.58],[45.58,45.86],[45.86,46.2],[46.2,46.62],[47.18,47.3],[47.3,47.5],[47.5,47.64],[47.64,47.94],[47.94,48.24],[48.24,48.58],[48.58,48.86],[48.86,49.24],[49.24,49.38],[49.38,49.82],[49.82,51.22],[51.22,51.26],[51.26,51.46],[51.46,51.8],[51.8,52],[52,52.26],[52.26,52.54],[52.54,52.86],[52.86,53.14],[53.14,53.48],[54.02,54.18],[54.18,54.34],[54.34,54.54],[54.54,54.98],[55.7,56],[56,56.3],[56.3,56.46],[56.46,56.72],[56.72,57.02],[57.02,57.12],[57.12,57.48],[57.48,57.82],[57.82,58.26],[58.26,58.42],[58.42,58.6],[58.6,59.06],[59.06,59.34],[59.34,59.7],[59.7,60.02],[60.02,60.44],[60.44,60.66],[60.66,60.9],[61.62,61.9],[61.9,62.14],[62.14,62.24],[62.24,62.56],[62.56,62.88],[62.88,63.26],[63.26,63.46],[63.88,63.98],[63.98,64.36],null,[64.88,64.94],[64.94,65.12],[65.12,65.56],null,[66.62,66.76],[66.76,67.06],[67.06,67.4],[67.4,67.76],[67.76,68.36],[68.36,68.4],[68.4,68.6],[68.6,69.18],[69.18,69.28],[69.28,69.5],[69.5,69.72],[69.72,70.08],[70.08,70.26],[70.26,70.5],[70.5,70.9],[71.86,72.04],[72.04,72.18],[72.18,72.48],[72.48,72.88],[72.88,73.54],[73.8,74.08],[74.08,74.34],[74.34,74.6],[74.6,74.92],[74.92,75.24],[75.24,75.64],[75.64,75.88],[75.88,76.72],[77.52,77.7],[77.7,77.82],[77.82,77.96],[77.96,78.28],[78.28,78.58],[78.58,78.98],[78.98,79.28],[79.28,79.5],[79.5,79.88],[79.88,80],[80,80.26],[80.92,81.22],[81.22,81.42],[81.42,81.62],[81.62,82.04],[82.6,82.9],[82.9,83.12],[83.12,83.38],[83.38,83.6],[83.6,83.82],[83.82,84.16],[84.16,84.8],[84.8,84.9],[84.9,85.26],[85.26,85.86],[85.86,85.98],[85.98,86.3],[87.22,87.38],[87.38,87.5],[87.5,87.68],[87.68,87.94],[87.94,88.28],[88.28,88.54],[88.54,88.78],[88.78,89.16],[89.16,89.66],[89.66,89.98],[89.98,90.38],[90.38,90.48],[90.48,90.8],[91.34,91.76],[91.76,92.18],[92.18,92.38],[92.38,92.66],[93.54,93.78],[93.78,94.08],[94.08,94.38],[94.38,94.7],[94.7,95.02],[95.02,95.44],[95.44,95.74],[95.74,96.28],[96.7,97.04],[97.04,97.44],[97.44,97.82],[97.82,97.86],[97.86,98.18],[98.18,98.48],[98.48,99.14],[99.94,100.12],[100.12,100.32],[100.32,100.48],[100.48,100.7],[100.7,101.1],[101.1,101.46],[101.46,101.72],[101.72,102.34],[102.34,102.58],[102.58,102.76],[102.76,102.9],[102.9,103.12],[103.12,103.4],[103.4,103.58],[103.58,103.82],[103.82,104.04],[104.6,104.82],[104.82,105.1],[105.1,105.5],[105.5,105.7],[105.7,106.06],[106.06,106.36],[106.36,106.4],[106.4,106.66],[106.66,107.08],[107.08,107.5],[107.5,107.84],[107.84,108.32],[108.68,109.04],[109.04,109.5],[109.5,109.8],[109.8,110.02],[110.02,110.72],[111.28,111.54],[111.54,111.82],[111.82,112.04],[112.04,112.26],[112.26,112.5],[112.94,113.12],[113.12,113.6],[114.5,114.58],[114.58,114.72],[114.72,115.02],[115.02,115.26],[115.26,115.48],[115.48,116.16],[116.16,116.48],[116.48,116.64],[116.64,116.86],[116.86,117.14],[117.14,117.34],[117.34,117.6],[117.6,117.98],[117.98,118.38],[119.32,119.44],[119.44,119.58],[119.58,119.8],[119.8,120.18],[120.18,120.48],[120.48,120.78],[121.28,121.36],[121.36,121.5],[121.5,121.64],[121.64,122.08],[122.08,122.34],[122.34,122.58]]
        },
        "title": "第四列",
        "theme": {
          "zh": "孤岛寻芳",
          "en": "A Botanist's Solitary Expedition"
        },
        "words": [
          {
            "id": "s4col4-brisk",
            "word": "brisk",
            "pos": "adj.",
            "meaning": "轻快的；凛冽的"
          },
          {
            "id": "s4col4-consciousness",
            "word": "consciousness",
            "pos": "n.",
            "meaning": "意识；知觉"
          },
          {
            "id": "s4col4-surplus",
            "word": "surplus",
            "pos": "n.",
            "meaning": "过剩；剩余"
          },
          {
            "id": "s4col4-score",
            "word": "score",
            "pos": "n.",
            "meaning": "二十（计数量词）"
          },
          {
            "id": "s4col4-flatter",
            "word": "flatter",
            "pos": "v.",
            "meaning": "奉承；讨好"
          },
          {
            "id": "s4col4-spectator",
            "word": "spectator",
            "pos": "n.",
            "meaning": "旁观者；观众"
          },
          {
            "id": "s4col4-craze",
            "word": "craze",
            "pos": "n.",
            "meaning": "狂热；风潮"
          },
          {
            "id": "s4col4-upbringing",
            "word": "upbringing",
            "pos": "n.",
            "meaning": "抚养；教养"
          },
          {
            "id": "s4col4-rationing",
            "word": "rationing",
            "pos": "n.",
            "meaning": "配给；定量供应"
          },
          {
            "id": "s4col4-lump",
            "word": "lump",
            "pos": "n.",
            "meaning": "肿块；硬块"
          },
          {
            "id": "s4col4-renowned",
            "word": "renowned",
            "pos": "adj.",
            "meaning": "著名的"
          },
          {
            "id": "s4col4-uplift",
            "word": "uplift",
            "pos": "n.",
            "meaning": "振奋；提升"
          },
          {
            "id": "s4col4-friction",
            "word": "friction",
            "pos": "n.",
            "meaning": "摩擦；冲突"
          },
          {
            "id": "s4col4-liable",
            "word": "liable",
            "pos": "adj.",
            "meaning": "易于…的；可能…的"
          },
          {
            "id": "s4col4-populate",
            "word": "populate",
            "pos": "v.",
            "meaning": "居住于；占据"
          },
          {
            "id": "s4col4-soothe",
            "word": "soothe",
            "pos": "v.",
            "meaning": "安慰；抚慰"
          },
          {
            "id": "s4col4-mansion",
            "word": "mansion",
            "pos": "n.",
            "meaning": "宅邸；大厦"
          },
          {
            "id": "s4col4-worldly",
            "word": "worldly",
            "pos": "adj.",
            "meaning": "世俗的；尘世的"
          },
          {
            "id": "s4col4-garment",
            "word": "garment",
            "pos": "n.",
            "meaning": "衣服；服装"
          },
          {
            "id": "s4col4-proclaim",
            "word": "proclaim",
            "pos": "v.",
            "meaning": "宣称；宣告"
          },
          {
            "id": "s4col4-torture",
            "word": "torture",
            "pos": "n.",
            "meaning": "折磨；酷刑"
          },
          {
            "id": "s4col4-fleet",
            "word": "fleet",
            "pos": "n.",
            "meaning": "船队；舰队"
          },
          {
            "id": "s4col4-attain",
            "word": "attain",
            "pos": "v.",
            "meaning": "获得；达到"
          },
          {
            "id": "s4col4-solitary",
            "word": "solitary",
            "pos": "adj.",
            "meaning": "孤独的；独自的"
          },
          {
            "id": "s4col4-complement",
            "word": "complement",
            "pos": "v.",
            "meaning": "补充；补足"
          },
          {
            "id": "s4col4-dissertation",
            "word": "dissertation",
            "pos": "n.",
            "meaning": "学位论文"
          },
          {
            "id": "s4col4-kidnap",
            "word": "kidnap",
            "pos": "v.",
            "meaning": "绑架；劫持"
          },
          {
            "id": "s4col4-roam",
            "word": "roam",
            "pos": "v.",
            "meaning": "漫游；徜徉"
          },
          {
            "id": "s4col4-obscure",
            "word": "obscure",
            "pos": "adj.",
            "meaning": "鲜为人知的；晦涩的"
          },
          {
            "id": "s4col4-stripe",
            "word": "stripe",
            "pos": "n.",
            "meaning": "条纹；狭长地带"
          },
          {
            "id": "s4col4-magnetic",
            "word": "magnetic",
            "pos": "adj.",
            "meaning": "有磁性的；有吸引力的"
          },
          {
            "id": "s4col4-credibility",
            "word": "credibility",
            "pos": "n.",
            "meaning": "可信度；信誉"
          },
          {
            "id": "s4col4-botanist",
            "word": "botanist",
            "pos": "n.",
            "meaning": "植物学家"
          },
          {
            "id": "s4col4-injection",
            "word": "injection",
            "pos": "n.",
            "meaning": "注射"
          },
          {
            "id": "s4col4-caption",
            "word": "caption",
            "pos": "n.",
            "meaning": "说明文字；标题"
          }
        ],
        "paragraphs": [
          {
            "id": "s4col4-p1",
            "segments": [
              "The ",
              {
                "vocabId": "s4col4-renowned",
                "text": "renowned"
              },
              "\n",
              {
                "vocabId": "s4col4-botanist",
                "text": "botanist"
              },
              " Dr. Elena Voss adjusted her weathered ",
              {
                "vocabId": "s4col4-garment",
                "text": "garment"
              },
              " against the ",
              {
                "vocabId": "s4col4-brisk",
                "text": "brisk"
              },
              " wind sweeping across the remote peninsula. She had come alone on this ",
              {
                "vocabId": "s4col4-solitary",
                "text": "solitary"
              },
              " expedition, seeking a rare medicinal plant whose ",
              {
                "vocabId": "s4col4-magnetic",
                "text": "magnetic"
              },
              " pull on her ",
              {
                "vocabId": "s4col4-consciousness",
                "text": "consciousness"
              },
              " had grown unbearable."
            ],
            "analysis": {
              "translation": "著名植物学家埃琳娜·沃斯博士整理了一下破旧的衣物以抵御横扫偏远半岛的凛冽寒风。她独自一人来到这次孤独的考察中，寻找一种稀有药用植物，这种植物对她意识的磁性吸引力已经到了无法忍受的地步。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “著名植物学家埃琳娜·沃斯博士整理了一下破旧的衣物以…” → “她独自一人来到这次孤独的考察中，寻找一种稀有药用植…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The renowned botanist Dr. Elena Voss adjusted her weathered garment against the brisk wind\"。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">adjust... against...</span> 调整……以抵御……，adjusted her weathered garment against the brisk wind 意为“整理衣物以抵御寒风”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语sweeping across the remote peninsula作后置定语，修饰wind，表示“横扫偏远半岛的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">weathered</span> 饱经风霜的、破旧的，weathered garment 意为“破旧的衣物”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语seeking a rare medicinal plant作伴随状语，表示“寻找一种稀有药用植物”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：whose magnetic pull on her consciousness had grown unbearable 修饰plant，whose作定语。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">magnetic pull</span> 磁性般的吸引力，比喻对该植物的强烈渴望。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">grow + 形容词</span>：had grown unbearable，grow为系动词后接形容词作表语，意为“变得无法忍受”。",
                "<span class=\"keyword\">语境搭配</span>：renowned 出现在“The renowned botanist Dr”中，本段取“著名的”义；botanist 出现在“The renowned botanist Dr”中，本段取“植物学家”义；garment 出现在“her weathered garment against the brisk”中，本段取“衣服”义；brisk 出现在“against the brisk wind sweeping across”中，本段取“轻快的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col4-p2",
            "segments": [
              "A ",
              {
                "vocabId": "s4col4-score",
                "text": "score"
              },
              " of years had passed since she last stood on this shore. As a child, her ",
              {
                "vocabId": "s4col4-upbringing",
                "text": "upbringing"
              },
              " in a crumbling ",
              {
                "vocabId": "s4col4-mansion",
                "text": "mansion"
              },
              " had been marked by wartime ",
              {
                "vocabId": "s4col4-rationing",
                "text": "rationing"
              },
              " and a ",
              {
                "vocabId": "s4col4-surplus",
                "text": "surplus"
              },
              " of silence. Her father would ",
              {
                "vocabId": "s4col4-proclaim",
                "text": "proclaim"
              },
              " that science was the only path to ",
              {
                "vocabId": "s4col4-attain",
                "text": "attain"
              },
              " truth, yet he watched her ambitions with the cold detachment of a ",
              {
                "vocabId": "s4col4-spectator",
                "text": "spectator"
              },
              ". That rejection had formed a hard ",
              {
                "vocabId": "s4col4-lump",
                "text": "lump"
              },
              " in her chest, a quiet ",
              {
                "vocabId": "s4col4-torture",
                "text": "torture"
              },
              " that no achievement could ",
              {
                "vocabId": "s4col4-soothe",
                "text": "soothe"
              },
              "."
            ],
            "analysis": {
              "translation": "自她上次站在这片海岸上已经过去了二十年。小时候，她在摇摇欲坠的豪宅中成长的岁月被战时配给制和过度的沉默所标记。她的父亲会宣称科学是获得真理的唯一道路，然而他以旁观者般的冷漠注视着她的志向。那种拒绝在她胸口形成了一个硬结，一种任何成就都无法抚慰的静默折磨。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “自她上次站在这片海岸上已经过去了二十年” → “她的父亲会宣称科学是获得真理的唯一道路，然而他以旁…” → “那种拒绝在她胸口形成了一个硬结，一种任何成就都无法…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">a score of</span> 二十，a score of years 意为“二十年”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：since she last stood on this shore，由since引导，主句用过去完成时。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"her upbringing... had been marked by wartime rationing and a surplus of silence\"，使用被动语态。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">be marked by</span> 以……为特征/标记，had been marked by 表示“被……所标记”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">surplus</span> 过剩、多余，a surplus of silence 意为“过度的沉默”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：that science was the only path to attain truth 作proclaim的宾语，其中to attain truth为不定式作后置定语修饰path。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">方式状语</span>：with the cold detachment of a spectator，介词with引导方式状语，表示“以旁观者般的冷漠”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that no achievement could soothe 修饰torture，that作soothe的宾语。",
                "<span class=\"keyword\">语境搭配</span>：score 出现在“A score of years had”中，本段取“二十（计数量词）”义；upbringing 出现在“her upbringing in a crumbling”中，本段取“抚养”义；mansion 出现在“a crumbling mansion had been marked”中，本段取“宅邸”义；rationing 出现在“by wartime rationing and a surplus”中，本段取“配给”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col4-p3",
            "segments": [
              "Now, hiking paths where few humans ",
              {
                "vocabId": "s4col4-populate",
                "text": "populate"
              },
              " the landscape, she let her thoughts ",
              {
                "vocabId": "s4col4-roam",
                "text": "roam"
              },
              " as freely as the seabirds overhead. A small ",
              {
                "vocabId": "s4col4-fleet",
                "text": "fleet"
              },
              " of fishing boats dotted the horizon, but she barely noticed. Her mind was fixed on the ",
              {
                "vocabId": "s4col4-obscure",
                "text": "obscure"
              },
              " flower said to grow only along one rocky ",
              {
                "vocabId": "s4col4-stripe",
                "text": "stripe"
              },
              " of cliff. Finding it would validate her life's work, her ",
              {
                "vocabId": "s4col4-dissertation",
                "text": "dissertation"
              },
              ", her very ",
              {
                "vocabId": "s4col4-credibility",
                "text": "credibility"
              },
              "."
            ],
            "analysis": {
              "translation": "如今，在鲜有人迹的小径上徒步时，她让自己的思绪像头顶的海鸟一样自由漫游。一小队渔船点缀着地平线，但她几乎没有注意到。她的心思专注于那朵据说只生长在悬崖上某条岩石带上的隐秘花朵。找到它将验证她毕生的工作、她的论文、她全部的信誉。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “如今，在鲜有人迹的小径上徒步时，她让自己的思绪像头…” → “她的心思专注于那朵据说只生长在悬崖上某条岩石带上的…” → “找到它将验证她毕生的工作、她的论文、她全部的信誉” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：现在分词短语hiking paths where few humans populate the landscape作时间/伴随状语，其中where引导定语从句修饰paths。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：where few humans populate the landscape 修饰paths，where作地点状语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">as... as...</span> 比较结构：as freely as the seabirds overhead，表示“像头顶的海鸟一样自由”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">let + 宾语 + 宾补</span>：let her thoughts roam，roam为省略to的不定式作宾语补足语。",
                "<span class=\"keyword\">地道表达</span>：该句由but连接两个并列分句，but she barely noticed 表示转折。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">be fixed on</span> 专注于、固定于，Her mind was fixed on 意为“她的心思专注于”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">过去分词短语</span>：said to grow only along one rocky stripe of cliff 作后置定语修饰flower，表示“据说只生长在……的”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">动名词作主语</span>：Finding it would validate...，Finding it为动名词短语作主语，谓语用单数would validate。",
                "<span class=\"keyword\">语境搭配</span>：populate 出现在“few humans populate the landscape”中，本段取“居住于”义；roam 出现在“her thoughts roam as freely as”中，本段取“漫游”义；fleet 出现在“A small fleet of fishing boats”中，本段取“船队”义；obscure 出现在“on the obscure flower said to”中，本段取“鲜为人知的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col4-p4",
            "segments": [
              "She recalled how, years ago, a media ",
              {
                "vocabId": "s4col4-craze",
                "text": "craze"
              },
              " had tried to ",
              {
                "vocabId": "s4col4-flatter",
                "text": "flatter"
              },
              " her into celebrity. She had refused every interview, knowing that praise was ",
              {
                "vocabId": "s4col4-liable",
                "text": "liable"
              },
              " to breed complacency. There had been ",
              {
                "vocabId": "s4col4-friction",
                "text": "friction"
              },
              " with colleagues who accused her of arrogance, but she ignored them. What she sought was not admiration but the quiet ",
              {
                "vocabId": "s4col4-uplift",
                "text": "uplift"
              },
              " of discovery."
            ],
            "analysis": {
              "translation": "她回忆起多年前一场媒体狂热如何试图用奉承将她推入名利场。她拒绝了每一次采访，因为她知道赞美容易滋生自满。她与指责她傲慢的同事之间曾有过摩擦，但她不理会他们。她所追求的不是仰慕，而是发现带来的静默升华。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她回忆起多年前一场媒体狂热如何试图用奉承将她推入名…” → “她与指责她傲慢的同事之间曾有过摩擦，但她不理会他们” → “她所追求的不是仰慕，而是发现带来的静默升华” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">宾语从句</span>：how... a media craze had tried to flatter her into celebrity 作recalled的宾语，由how引导。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">flatter sb. into sth.</span> 奉承某人使其做某事/成为某物，flatter her into celebrity 意为“用奉承使她成为名人”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语knowing that praise was liable to breed complacency作原因/伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">be liable to</span> 易于……的、有可能……的，praise was liable to breed complacency 表示“赞美容易滋生自满”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">breed</span> 滋生、繁殖，breed complacency 意为“滋生自满”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：who accused her of arrogance 修饰colleagues，who作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">accuse sb. of sth.</span> 指责某人某事，accused her of arrogance 意为“指责她傲慢”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">主语从句</span>：What she sought 作主语，what引导名词性从句，后接not... but...结构表示“不是仰慕而是发现带来的静默升华”。",
                "<span class=\"keyword\">语境搭配</span>：craze 出现在“a media craze had tried to”中，本段取“狂热”义；flatter 出现在“tried to flatter her into celebrity”中，本段取“奉承”义；liable 出现在“praise was liable to breed complacency”中，本段取“易于…的”义；friction 出现在“had been friction with colleagues who”中，本段取“摩擦”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col4-p5",
            "segments": [
              "When at last she spotted the pale blue petals clinging to the stone, tears stung her eyes. This plant, she believed, could ",
              {
                "vocabId": "s4col4-complement",
                "text": "complement"
              },
              " modern medicine, offering relief where a synthetic ",
              {
                "vocabId": "s4col4-injection",
                "text": "injection"
              },
              " failed. No one would ",
              {
                "vocabId": "s4col4-kidnap",
                "text": "kidnap"
              },
              " this knowledge for profit—not if she had anything to say about it. She photographed the flower and wrote a careful ",
              {
                "vocabId": "s4col4-caption",
                "text": "caption"
              },
              " beneath each image, documenting the moment for posterity."
            ],
            "analysis": {
              "translation": "当她终于看到那些攀附在石头上的淡蓝色花瓣时，泪水刺痛了她的双眼。她相信这种植物可以补充现代医学，在合成注射剂失效的地方提供缓解。没有人会为了利润而劫持这份知识——只要她还有发言权就不会。她给花拍了照，并在每张照片下方写下了仔细的说明文字，为后世记录下这一刻。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当她终于看到那些攀附在石头上的淡蓝色花瓣时，泪水刺…” → “没有人会为了利润而劫持这份知识——只要她还有发言权…” → “她给花拍了照，并在每张照片下方写下了仔细的说明文字…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">时间状语从句</span>：When at last she spotted the pale blue petals clinging to the stone，由When引导。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语clinging to the stone作后置定语，修饰petals，表示“攀附在石头上的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">插入语</span>：she believed 为插入成分，表示“她相信”，可视为省略that的宾语从句框架。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">complement</span> 补充、补足，could complement modern medicine 意为“可以补充现代医学”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语offering relief where a synthetic injection failed作伴随状语，其中where引导<span class=\"keyword\">地点状语从句</span>，表示“在合成注射剂失效之处”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">kidnap</span> 劫持、绑架，kidnap this knowledge for profit 意为“为利润劫持这份知识”，此处为隐喻用法。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">条件状语从句</span>：not if she had anything to say about it，if引导条件状语，not表示否定前置于破折号后。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">for posterity</span> 为了后世、为子孙后代，documenting the moment for posterity 意为“为后世记录这一刻”。",
                "<span class=\"keyword\">语境搭配</span>：complement 出现在“could complement modern medicine”中，本段取“补充”义；injection 出现在“a synthetic injection failed”中，本段取“注射”义；kidnap 出现在“one would kidnap this knowledge for”中，本段取“绑架”义；caption 出现在“a careful caption beneath each image”中，本段取“说明文字”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s4col4-p6",
            "segments": [
              "She knelt beside the flower, breathing slowly. In that moment, the ",
              {
                "vocabId": "s4col4-worldly",
                "text": "worldly"
              },
              " ambitions that had once weighed her down seemed distant. She had not escaped her past, but she had outgrown its grip."
            ],
            "analysis": {
              "translation": "她跪在花旁，缓缓地呼吸。在那一刻，曾经压在她身上的世俗抱负似乎已很遥远。她没有逃离过去，但她已超越了过去的掌控。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她跪在花旁，缓缓地呼吸” → “在那一刻，曾经压在她身上的世俗抱负似乎已很遥远” → “她没有逃离过去，但她已超越了过去的掌控” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：现在分词短语breathing slowly作伴随状语，表示“缓缓地呼吸”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that had once weighed her down 修饰ambitions，that作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">weigh sb. down</span> 压垮某人、使某人沉重，had once weighed her down 意为“曾经压在她身上”。",
                "<span class=\"keyword\">逻辑衔接</span>：该句由but连接两个并列分句，表转折关系。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">outgrow</span> 长得太大而不适用、超越，had outgrown its grip 意为“已超越其掌控”，its指代her past。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">worldly</span> 世俗的、尘世的，worldly ambitions 意为“世俗的抱负”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">grip</span> 紧抓、掌控，its grip 指过去的束缚/掌控。",
                "<span class=\"keyword\">语境搭配</span>：worldly 出现在“the worldly ambitions that had”中，本段取“世俗的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "set5",
    "number": 5,
    "label": "第五份",
    "columns": [
      {
        "id": "s5col1",
        "number": 1,
        "audio": {
          "src": "audio/list5_col1.mp3",
          "cues": [[3.7,3.86],[4.18,4.72],[4.72,5.26],[5.26,5.29],[5.29,5.6],[5.6,6.02],[6.02,6.5],[6.5,6.88],[6.88,7.14],[7.14,7.82],null,[8.3,8.48],[8.48,8.7],[8.7,8.86],[8.86,9.2],[9.2,9.68],[9.68,10.02],[10.02,10.32],[10.32,10.6],[11.18,11.4],[11.4,12.56],[12.56,12.74],[12.74,12.92],[12.92,13.24],[13.24,13.44],[13.44,13.66],[13.66,13.78],[13.78,14.1],[14.1,14.18],[14.18,14.34],[14.34,14.62],[14.62,14.86],[15.16,15.44],[15.44,15.82],[15.82,16.28],[16.28,16.52],[16.52,16.68],[16.68,16.98],[16.98,17.36],[17.36,17.68],[18.14,18.32],[18.32,18.56],[18.56,19],[19,19.52],[20.34,20.7],[20.7,20.96],[20.96,21.5],[21.5,21.86],[21.86,22.3],[22.3,22.62],[22.62,23.02],[23.02,23.24],[23.24,23.42],[23.42,23.8],[23.8,24.12],[24.12,24.6],[24.6,25.68],[25.68,25.98],[25.98,26.36],[26.36,26.66],[26.66,26.82],[26.82,27.08],[27.08,27.46],[27.46,27.82],[27.82,28.2],[28.2,28.46],[28.46,28.96],[28.96,29.26],[29.26,29.58],[29.58,30],[30.56,30.76],[30.76,31.14],[31.14,31.18],[31.18,31.56],[31.56,31.88],[31.88,32.14],[32.14,32.36],[32.36,32.64],[32.64,33.12],[33.12,33.17],[33.17,33.52],[34.22,34.36],[34.36,34.76],[34.76,34.96],[34.96,35.24],[35.24,35.56],[35.56,35.92],[35.92,36.3],[36.3,36.66],[36.66,37.38],null,[38.22,38.45],[38.45,38.68],[38.68,39.08],[39.08,39.58],[40.24,40.44],[40.44,40.64],[40.64,40.9],[40.9,41.18],[41.26,41.34],[41.34,41.64],[41.64,42.06],[42.06,42.3],[42.3,42.84],[42.84,43.14],[43.14,43.4],[43.4,43.66],[43.66,43.84],[43.84,44.18],[44.18,44.48],[44.48,44.7],[44.7,45.02],[45.02,46.18],[46.18,46.48],[46.48,46.72],[46.72,47.28],null,[47.28,47.74],[47.74,48.08],[48.08,48.64],[49.1,49.26],[49.26,49.52],[49.52,49.82],[49.82,50.16],[50.88,51.3],[51.3,51.78],[52.16,52.34],[52.34,52.54],[52.54,52.78],[52.78,53.32],[53.68,54.02],[54.02,54.42],[54.42,54.82],[54.82,55.3],[55.3,55.66],[55.66,56.2],[56.2,56.4],[56.4,57.9],[57.9,57.94],[57.94,58.18],[58.18,58.6],[58.6,58.86],[58.86,59.04],[59.04,59.38],[59.38,59.82],[59.82,60.18],[60.18,60.4],[60.4,60.62],[60.62,61.2],[61.2,61.54],[61.54,61.84],[61.84,62.38],[62.38,62.68],[62.68,62.94],[62.94,63.18],[63.18,63.36],[63.36,63.76],[63.76,64.24],[64.24,65],[66.02,66.28],[66.28,66.54],[66.54,66.98],null,[67.44,67.64],[67.64,68.02],[68.02,68.34],[68.34,68.6],[68.6,68.84],[68.84,69.24],[69.24,69.66],[69.66,69.92],[69.92,70.38],[71.08,71.26],[71.26,71.64],[71.64,72.2],[72.2,72.6],[72.6,72.88],[72.88,73.4],[74.08,74.37],[74.37,74.66],[74.66,74.98],[74.98,75.22],[75.22,75.42],[75.42,75.64],[75.64,76.08],[76.08,76.34],[76.34,76.66],[76.66,76.86],[76.86,77.28],[77.28,77.88],[77.88,78.18],[78.18,78.38],[78.38,78.8],[78.8,79.6],[80.1,80.22],[80.22,80.44],[80.44,80.74],[80.74,81.06],[81.06,81.36],[81.36,81.7],[81.7,82.1],[82.1,82.38],[82.38,83.26],[83.26,83.29],[83.29,83.48],[83.48,83.92],[83.92,84.24],[84.24,84.4],[84.4,84.74],[85.28,85.8],[85.8,85.83],[85.83,86.06],[86.06,86.56],[86.56,86.84],[86.84,87.22],[87.7,87.86],[87.86,88.26],[88.26,88.6],[88.6,88.86],[88.86,89.04],[89.04,89.34],[90.08,90.24],[90.24,90.48],[90.48,90.7],[90.7,91.02],[91.02,91.24],[91.24,91.38],[91.38,91.72],[91.72,92.12],[92.12,92.3],[92.3,92.52],[92.52,92.92],[93.2,93.42],[93.42,93.8],[93.8,94.14],[94.14,94.4],[94.4,94.68],[94.68,95.08],[95.08,95.54],[95.54,95.84],[95.84,96.34],[97.14,97.48],[97.48,97.84],[97.84,98.08],[98.08,98.32],[98.32,98.52],[98.52,98.78],[98.78,99.18],[99.52,99.86],[99.86,100.4],[101.18,101.5],[101.5,101.84],[101.84,102.06],[102.06,102.32],[102.32,102.74],[102.74,102.9],[102.9,103.12],[103.12,103.38],[103.38,103.66],[103.66,104.06],[104.06,105.14],[105.14,105.18],[105.18,105.38],[105.38,105.86],[105.86,106.24],[106.24,106.72],[106.72,107.88],[107.88,107.91],[107.91,108.14],[108.14,108.54],[108.54,108.7],[108.7,108.86],[108.86,109.38],[109.62,109.74],[109.74,109.92],[109.92,110.4],[110.4,110.94],null,[111.46,111.7],[111.7,112.06],[112.06,112.24],[112.24,112.88],[113.72,113.9],[113.9,114.22],[114.22,114.52],[114.52,114.78],[114.78,115.1],[115.1,115.34],[115.34,115.68],[115.68,116.24],[116.24,116.74],[117.48,117.7],[117.7,118.08],[118.24,118.26],[118.26,118.66],[118.66,118.92],[118.92,119.18],[119.18,119.44],[119.44,119.76],[119.86,120.06],[120.06,120.3],[120.3,120.68],[120.84,121.04],[121.04,121.24],[121.24,121.64],[121.64,122.04],[122.04,122.34],[122.34,122.56],[122.56,122.82],[122.82,123.1]]
        },
        "title": "第一列",
        "theme": {
          "zh": "制药风暴",
          "en": "A Researcher Races Against a Perilous Epidemic"
        },
        "words": [
          {
            "id": "s5col1-traumatic",
            "word": "traumatic",
            "pos": "adj.",
            "meaning": "创伤的；造成精神创伤的"
          },
          {
            "id": "s5col1-deceive",
            "word": "deceive",
            "pos": "v.",
            "meaning": "欺骗；蒙蔽"
          },
          {
            "id": "s5col1-elicit",
            "word": "elicit",
            "pos": "v.",
            "meaning": "引起；引出"
          },
          {
            "id": "s5col1-unplug",
            "word": "unplug",
            "pos": "v.",
            "meaning": "拔掉插头；断开连接"
          },
          {
            "id": "s5col1-hyperactivity",
            "word": "hyperactivity",
            "pos": "n.",
            "meaning": "极度活跃；多动"
          },
          {
            "id": "s5col1-atlas",
            "word": "atlas",
            "pos": "n.",
            "meaning": "地图集；图集"
          },
          {
            "id": "s5col1-chronicle",
            "word": "chronicle",
            "pos": "n.",
            "meaning": "编年史；记录"
          },
          {
            "id": "s5col1-reckless",
            "word": "reckless",
            "pos": "adj.",
            "meaning": "鲁莽的；不计后果的"
          },
          {
            "id": "s5col1-neutral",
            "word": "neutral",
            "pos": "adj.",
            "meaning": "中立的；不偏不倚的"
          },
          {
            "id": "s5col1-harness",
            "word": "harness",
            "pos": "v.",
            "meaning": "利用；驾驭"
          },
          {
            "id": "s5col1-creep",
            "word": "creep",
            "pos": "v.",
            "meaning": "悄悄蔓延；潜行"
          },
          {
            "id": "s5col1-crossbreed",
            "word": "crossbreed",
            "pos": "v.",
            "meaning": "杂交；交叉培育"
          },
          {
            "id": "s5col1-successive",
            "word": "successive",
            "pos": "adj.",
            "meaning": "连续的；接连的"
          },
          {
            "id": "s5col1-sightseeing",
            "word": "sightseeing",
            "pos": "n.",
            "meaning": "观光；游览"
          },
          {
            "id": "s5col1-submarine",
            "word": "submarine",
            "pos": "n.",
            "meaning": "潜水艇"
          },
          {
            "id": "s5col1-elevation",
            "word": "elevation",
            "pos": "n.",
            "meaning": "海拔；高处"
          },
          {
            "id": "s5col1-formation",
            "word": "formation",
            "pos": "n.",
            "meaning": "结构；形成物"
          },
          {
            "id": "s5col1-revival",
            "word": "revival",
            "pos": "n.",
            "meaning": "复苏；复兴"
          },
          {
            "id": "s5col1-molecular",
            "word": "molecular",
            "pos": "adj.",
            "meaning": "分子的"
          },
          {
            "id": "s5col1-banquet",
            "word": "banquet",
            "pos": "n.",
            "meaning": "宴会"
          },
          {
            "id": "s5col1-coincide",
            "word": "coincide",
            "pos": "v.",
            "meaning": "同时发生；巧合"
          },
          {
            "id": "s5col1-trim",
            "word": "trim",
            "pos": "v.",
            "meaning": "修剪；整理"
          },
          {
            "id": "s5col1-stalk",
            "word": "stalk",
            "pos": "v.",
            "meaning": "悄悄跟踪；纠缠"
          },
          {
            "id": "s5col1-cocaine",
            "word": "cocaine",
            "pos": "n.",
            "meaning": "可卡因"
          },
          {
            "id": "s5col1-cultivation",
            "word": "cultivation",
            "pos": "n.",
            "meaning": "培养；栽培"
          },
          {
            "id": "s5col1-ritual",
            "word": "ritual",
            "pos": "n.",
            "meaning": "惯例；仪式"
          },
          {
            "id": "s5col1-buzz",
            "word": "buzz",
            "pos": "n.",
            "meaning": "嗡嗡声；喧闹"
          },
          {
            "id": "s5col1-comply",
            "word": "comply",
            "pos": "v.",
            "meaning": "遵从；服从"
          },
          {
            "id": "s5col1-nominee",
            "word": "nominee",
            "pos": "n.",
            "meaning": "被提名人"
          },
          {
            "id": "s5col1-pharma",
            "word": "pharma",
            "pos": "n.",
            "meaning": "制药（业）"
          },
          {
            "id": "s5col1-pharmacist",
            "word": "pharmacist",
            "pos": "n.",
            "meaning": "药剂师"
          },
          {
            "id": "s5col1-wary",
            "word": "wary",
            "pos": "adj.",
            "meaning": "警惕的；小心的"
          },
          {
            "id": "s5col1-recipient",
            "word": "recipient",
            "pos": "n.",
            "meaning": "接受者；受药者"
          },
          {
            "id": "s5col1-peril",
            "word": "peril",
            "pos": "n.",
            "meaning": "危险；危难"
          },
          {
            "id": "s5col1-dwarf",
            "word": "dwarf",
            "pos": "v.",
            "meaning": "使相形见绌；使显得渺小"
          },
          {
            "id": "s5col1-counsel",
            "word": "counsel",
            "pos": "n.",
            "meaning": "建议；忠告"
          }
        ],
        "paragraphs": [
          {
            "id": "s5col1-p1",
            "segments": [
              "Dr. Lena Voss, a dedicated ",
              {
                "vocabId": "s5col1-pharma",
                "text": "pharma"
              },
              " researcher and former ",
              {
                "vocabId": "s5col1-pharmacist",
                "text": "pharmacist"
              },
              ", stared at the ",
              {
                "vocabId": "s5col1-molecular",
                "text": "molecular"
              },
              " models lining her lab. The epidemic's ",
              {
                "vocabId": "s5col1-successive",
                "text": "successive"
              },
              " waves had brought the city to the edge of ruin, and every ",
              {
                "vocabId": "s5col1-chronicle",
                "text": "chronicle"
              },
              " of the outbreak grew darker. The ",
              {
                "vocabId": "s5col1-peril",
                "text": "peril"
              },
              " was undeniable; bodies filled hospital corridors while panic began to ",
              {
                "vocabId": "s5col1-creep",
                "text": "creep"
              },
              " through every neighborhood."
            ],
            "analysis": {
              "translation": "莉娜·沃斯博士，一位专注的制药研究员和前药剂师，凝视着排列在她实验室里的分子模型。疫情的连续浪潮已将这座城市带到毁灭的边缘，关于疫情爆发的每一篇记录都变得更加黑暗。危险不可否认；尸体填满了医院走廊，而恐慌开始蔓延到每个社区。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “莉娜·沃斯博士，一位专注的制药研究员和前药剂师，凝…” → “疫情的连续浪潮已将这座城市带到毁灭的边缘，关于疫情…” → “危险不可否认” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">同位语</span>：a dedicated pharma researcher and former pharmacist 为Dr. Lena Voss的同位语，补充身份。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"Dr. Lena Voss... stared at the molecular models\"。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语lining her lab作后置定语，修饰models，表示“排列在实验室里的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">bring... to the edge of</span> 将……带到……的边缘，had brought the city to the edge of ruin 意为“将城市带到毁灭边缘”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">successive</span> 连续的、接连的，successive waves 意为“连续的浪潮”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：while panic began to creep through every neighborhood，由while引导，表示“与此同时”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">creep through</span> 蔓延穿过、悄悄渗透，panic began to creep through 表示“恐慌开始蔓延”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">peril</span> 危险，The peril was undeniable 意为“危险不可否认”。",
                "<span class=\"keyword\">语境搭配</span>：pharma 出现在“a dedicated pharma researcher and former”中，本段取“制药（业）”义；pharmacist 出现在“and former pharmacist”中，本段取“药剂师”义；molecular 出现在“at the molecular models lining her”中，本段取“分子的”义；successive 出现在“The epidemic's successive waves had brought”中，本段取“连续的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col1-p2",
            "segments": [
              "Lena's daily ",
              {
                "vocabId": "s5col1-ritual",
                "text": "ritual"
              },
              " was to review the ",
              {
                "vocabId": "s5col1-cultivation",
                "text": "cultivation"
              },
              " of viral cultures under the microscope, searching for a ",
              {
                "vocabId": "s5col1-formation",
                "text": "formation"
              },
              " she might ",
              {
                "vocabId": "s5col1-harness",
                "text": "harness"
              },
              " to build a vaccine. The lab's ",
              {
                "vocabId": "s5col1-buzz",
                "text": "buzz"
              },
              " of activity felt almost like ",
              {
                "vocabId": "s5col1-hyperactivity",
                "text": "hyperactivity"
              },
              ", technicians rushing between benches. To clear her head, she would sometimes step outside and gaze at the ",
              {
                "vocabId": "s5col1-elevation",
                "text": "elevation"
              },
              " of the distant hills—no time for ",
              {
                "vocabId": "s5col1-sightseeing",
                "text": "sightseeing"
              },
              ", only brief respites."
            ],
            "analysis": {
              "translation": "莉娜的日常惯例是在显微镜下审查病毒培养物的培育情况，寻找一种她可以利用来制造疫苗的结构。实验室里忙碌的嗡嗡声几乎像是过度亢奋，技师们在操作台之间奔忙。为了清醒头脑，她有时会走到外面，凝望远处山丘的高地——没时间观光，只有短暂的喘息。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “莉娜的日常惯例是在显微镜下审查病毒培养物的培育情况…” → “实验室里忙碌的嗡嗡声几乎像是过度亢奋，技师们在操作…” → “为了清醒头脑，她有时会走到外面，凝望远处山丘的高地…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">不定式作表语</span>：was to review the cultivation...，to review作表语说明ritual的内容。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语searching for a formation she might harness to build a vaccine作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句（省略that）</span>：(that) she might harness to build a vaccine 修饰formation，省略了关系代词that/which，to build a vaccine为目的状语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">harness</span> 利用、驾驭，she might harness 意为“她可以利用的”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">独立主格结构</span>：technicians rushing between benches，名词+现在分词，表伴随状况。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">目的状语</span>：To clear her head 为不定式短语作目的状语，意为“为了清醒头脑”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">respites</span> 喘息、暂缓，brief respites 意为“短暂的喘息”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">gaze at</span> 凝视、注视，gaze at the elevation of the distant hills 表示“凝望远处山丘的高地”。",
                "<span class=\"keyword\">语境搭配</span>：ritual 出现在“Lena's daily ritual was to review”中，本段取“惯例”义；cultivation 出现在“review the cultivation of viral cultures”中，本段取“培养”义；formation 出现在“for a formation she might harness”中，本段取“结构”义；harness 出现在“she might harness to build a”中，本段取“利用”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col1-p3",
            "segments": [
              "The path was treacherous. Some colleagues, ",
              {
                "vocabId": "s5col1-reckless",
                "text": "reckless"
              },
              " in their ambition, suggested they ",
              {
                "vocabId": "s5col1-deceive",
                "text": "deceive"
              },
              " oversight committees to accelerate trials. A fellow ",
              {
                "vocabId": "s5col1-nominee",
                "text": "nominee"
              },
              " for the research prize urged her to ",
              {
                "vocabId": "s5col1-crossbreed",
                "text": "crossbreed"
              },
              " two viral strains in ways that could ",
              {
                "vocabId": "s5col1-elicit",
                "text": "elicit"
              },
              " dangerous mutations. Lena remained ",
              {
                "vocabId": "s5col1-wary",
                "text": "wary"
              },
              ", seeking ",
              {
                "vocabId": "s5col1-counsel",
                "text": "counsel"
              },
              " from her ethics mentor before any decision."
            ],
            "analysis": {
              "translation": "道路是危险的。一些同事——在野心上鲁莽——建议欺骗监督委员会以加速试验。一位研究奖的共同被提名者敦促她以可能引发危险变异的方式杂交两种病毒株。莉娜保持警惕，在任何决定之前都向她的伦理导师寻求建议。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “道路是危险的” → “一位研究奖的共同被提名者敦促她以可能引发危险变异的…” → “莉娜保持警惕，在任何决定之前都向她的伦理导师寻求建…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">treacherous</span> 危险的、不可靠的，The path was treacherous 既指实际道路也暗喻处境危险。",
                "<span class=\"keyword\">结构拆解</span>：形容词短语reckless in their ambition作插入语/后置定语，修饰colleagues，表示“在野心上鲁莽的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句（虚拟语气）</span>：(that) they deceive oversight committees 作suggested的宾语，suggest后接宾语从句使用虚拟语气(should) deceive。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">accelerate</span> 加速，to accelerate trials 为目的状语。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">urge sb. to do sth.</span> 敦促某人做某事，urged her to crossbreed two viral strains。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that could elicit dangerous mutations 修饰ways，that作主语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">elicit</span> 引发、诱发，elicit dangerous mutations 意为“引发危险变异”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">wary</span> 警惕的、小心的，remained wary 中remained为系动词，wary作表语。现在分词短语seeking counsel from her ethics mentor作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：reckless 出现在“reckless in their ambition”中，本段取“鲁莽的”义；deceive 出现在“suggested they deceive oversight committees to”中，本段取“欺骗”义；nominee 出现在“A fellow nominee for the research”中，本段取“被提名人”义；crossbreed 出现在“her to crossbreed two viral strains”中，本段取“杂交”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col1-p4",
            "segments": [
              "The disease's ",
              {
                "vocabId": "s5col1-traumatic",
                "text": "traumatic"
              },
              " toll haunted her: survivors described agony that would ",
              {
                "vocabId": "s5col1-dwarf",
                "text": "dwarf"
              },
              " any suffering they had known, worse even than ",
              {
                "vocabId": "s5col1-cocaine",
                "text": "cocaine"
              },
              " withdrawal. She could not ",
              {
                "vocabId": "s5col1-comply",
                "text": "comply"
              },
              " with shortcuts that might endanger a future ",
              {
                "vocabId": "s5col1-recipient",
                "text": "recipient"
              },
              " of the drug. Like a ",
              {
                "vocabId": "s5col1-submarine",
                "text": "submarine"
              },
              " surfacing into light, her conscience broke through the pressure."
            ],
            "analysis": {
              "translation": "这种疾病的创伤性代价萦绕着她：幸存者描述的痛苦会使他们所经历的任何苦难相形见绌，甚至比可卡因戒断还要糟糕。她不能接受可能危及未来药物接受者的捷径。就像潜艇浮出水面进入光明一样，她的良知突破了压力。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这种疾病的创伤性代价萦绕着她：幸存者描述的痛苦会使…” → “她不能接受可能危及未来药物接受者的捷径” → “就像潜艇浮出水面进入光明一样，她的良知突破了压力” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The disease's traumatic toll haunted her\"，冒号后为同位语解释说明。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">haunt</span> 萦绕、困扰，traumatic toll haunted her 意为“创伤性代价困扰着她”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that would dwarf any suffering they had known 修饰agony，that作主语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">dwarf</span> 使相形见绌、使矮小，would dwarf any suffering 意为“会使任何苦难相形见绌”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">嵌套定语从句（省略that）</span>：(that) they had known 修饰suffering，省略了关系代词。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">comply with</span> 遵从、顺从，could not comply with shortcuts 意为“不能接受捷径”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句</span>：that might endanger a future recipient of the drug 修饰shortcuts，that作主语。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">明喻</span>：Like a submarine surfacing into light，用Like构成明喻，将良知突破压力比作潜艇浮出水面。",
                "<span class=\"keyword\">语境搭配</span>：traumatic 出现在“The disease's traumatic toll haunted her”中，本段取“创伤的”义；dwarf 出现在“that would dwarf any suffering they”中，本段取“使相形见绌”义；cocaine 出现在“even than cocaine withdrawal”中，本段取“可卡因”义；comply 出现在“could not comply with shortcuts that”中，本段取“遵从”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col1-p5",
            "segments": [
              "She kept an ",
              {
                "vocabId": "s5col1-atlas",
                "text": "atlas"
              },
              " of the outbreak pinned to her wall, plotting where case spikes would ",
              {
                "vocabId": "s5col1-coincide",
                "text": "coincide"
              },
              " with supply shortages. Each morning she would ",
              {
                "vocabId": "s5col1-trim",
                "text": "trim"
              },
              " the data, discarding noise. Rumors began to ",
              {
                "vocabId": "s5col1-stalk",
                "text": "stalk"
              },
              " her—that she was hoarding the formula. At a tense ",
              {
                "vocabId": "s5col1-banquet",
                "text": "banquet"
              },
              " honoring frontline workers, a reporter tried to corner her, but Lena stayed ",
              {
                "vocabId": "s5col1-neutral",
                "text": "neutral"
              },
              ", refusing to fuel speculation."
            ],
            "analysis": {
              "translation": "她把一幅疫情地图钉在墙上，标注病例激增与物资短缺同时发生的地方。每天早晨她会整理数据，剔除噪音。谣言开始纠缠她——说她囤积了配方。在一场致敬一线工作者的紧张宴会上，一位记者试图将她逼入困境，但莉娜保持中立，拒绝助长猜测。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她把一幅疫情地图钉在墙上，标注病例激增与物资短缺同…” → “谣言开始纠缠她——说她囤积了配方” → “在一场致敬一线工作者的紧张宴会上，一位记者试图将她…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">keep + 宾语 + 宾补</span>：kept an atlas... pinned to her wall，pinned为过去分词作宾语补足语，表示“被钉在墙上”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语plotting where case spikes would coincide with supply shortages作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：where case spikes would coincide with supply shortages 作plotting的宾语，由where引导。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">coincide with</span> 与……同时发生/巧合，would coincide with supply shortages 意为“与物资短缺同时发生”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语discarding noise作伴随状语，表示“剔除噪音”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">stalk</span> 纠缠、悄悄跟踪，Rumors began to stalk her 意为“谣言开始纠缠她”，拟人修辞。",
                "<span class=\"keyword\">结构拆解</span>：破折号后that she was hoarding the formula为同位语从句，解释rumors的内容。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">corner</span> 逼入困境、使走投无路，tried to corner her 意为“试图将她逼入困境”；refusing to fuel speculation中<span class=\"keyword\">fuel</span> 作动词意为“助长”。",
                "<span class=\"keyword\">语境搭配</span>：atlas 出现在“kept an atlas of the outbreak”中，本段取“地图集”义；coincide 出现在“spikes would coincide with supply shortages”中，本段取“同时发生”义；trim 出现在“she would trim the data”中，本段取“修剪”义；stalk 出现在“began to stalk her”中，本段取“悄悄跟踪”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col1-p6",
            "segments": [
              "The ",
              {
                "vocabId": "s5col1-revival",
                "text": "revival"
              },
              " of hope came when trials finally succeeded. That night, Lena chose to ",
              {
                "vocabId": "s5col1-unplug",
                "text": "unplug"
              },
              " her phone, sit in silence, and let herself believe the worst was over."
            ],
            "analysis": {
              "translation": "希望的复苏来临了——当试验终于成功时。那天晚上，莉娜选择拔掉电话，静坐沉默中，让自己相信最坏的已经过去。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “希望的复苏来临了——当试验终于成功时” → “那天晚上，莉娜选择拔掉电话，静坐沉默中，让自己相信…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The revival of hope came\"，when引导时间状语从句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间状语从句</span>：when trials finally succeeded，由when引导。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">revival</span> 复苏、复兴，The revival of hope 意为“希望的复苏”。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">choose to do sth.</span> 选择做某事，chose to unplug... 为三个并列不定式作宾语。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">三个并列不定式</span>：to unplug her phone, sit in silence, and let herself believe...，由and连接，作chose的宾语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">unplug</span> 拔掉插头、断开，unplug her phone 意为“拔掉电话”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">let + 宾语 + 宾补</span>：let herself believe，believe为省略to的不定式作宾语补足语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">宾语从句</span>：(that) the worst was over 作believe的宾语，省略了that。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：revival 出现在“The revival of hope came”中，本段取“复苏”义；unplug 出现在“chose to unplug her phone”中，本段取“拔掉插头”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s5col2",
        "number": 2,
        "audio": {
          "src": "audio/list5_col2.mp3",
          "cues": [[3.76,3.8],[3.8,4.06],[4.06,4.22],[4.22,4.4],[4.4,4.64],[4.64,5.1],[5.1,5.14],[5.14,5.34],[5.34,6],[6,6.24],[6.24,6.66],[6.66,7.24],[7.24,7.54],[7.54,8.08],[8.08,8.13],[8.13,8.38],[8.38,8.82],[8.82,9.26],[9.26,9.74],[10.2,10.44],[10.44,10.72],[10.72,11],[11,11.12],[11.12,11.48],[11.48,12.02],[12.6,12.82],[12.82,13.1],[13.1,13.28],[13.28,13.46],[13.46,13.84],[13.84,14.24],[14.24,14.68],[14.68,14.98],[14.98,15.58],[15.58,16.2],[16.2,16.6],[16.6,17.04],[17.04,17.42],[17.42,17.8],[18.44,18.72],[18.72,19.02],[19.02,19.36],[19.36,20],[20,20.4],[20.4,20.68],[20.68,21.06],[21.06,21.68],[22.2,22.34],[22.34,22.7],[22.7,23.32],[23.32,23.64],[23.64,23.98],[23.98,24.38],[24.38,24.46],[24.46,24.84],[24.84,25.3],[25.3,25.66],[25.66,26.34],[26.34,26.84],[26.84,27.48],[27.48,27.9],[27.9,28.34],[28.34,28.72],[28.72,29.12],[29.12,29.9],[29.9,30.38],[30.38,30.94],[30.94,30.97],[30.97,31.22],[31.22,31.46],[31.46,31.66],[31.66,31.9],[31.9,32.06],[32.06,32.28],[32.28,32.52],[32.52,32.78],[32.78,33.24],[33.96,34.02],[34.02,34.4],[34.4,34.64],[34.64,34.86],[34.86,35.18],[35.18,35.54],[35.86,36],[36,36.26],[36.26,36.48],[36.48,36.78],[36.78,37.28],null,[38.16,38.32],[38.32,39.18],[39.18,39.23],[39.23,39.48],[39.48,39.74],[39.74,39.98],[39.98,40.44],[40.44,41.04],[41.72,42.01],[42.01,42.3],null,[42.98,43.12],[43.12,43.38],[43.38,43.62],[43.62,43.94],[43.94,44.28],[44.54,44.8],[44.8,45.16],[45.74,46.06],[46.06,46.1],[46.1,46.34],[46.34,46.82],[46.82,47.22],[47.22,47.62],[47.62,48],[48.66,48.82],[48.82,49],[49,49.18],[49.18,49.42],[49.42,49.62],[49.62,49.84],[49.84,50.16],[50.16,50.38],[50.38,50.84],[50.84,51.18],[51.18,51.6],[52.3,52.52],[52.52,53],[53,53.03],[53.03,53.24],[53.24,53.48],[53.48,53.66],[53.66,54.06],[54.06,54.5],[54.5,54.6],[54.6,54.88],[54.88,55.12],[55.12,55.42],[55.42,56.28],[56.28,56.6],[56.6,57.7],null,[57.7,57.73],[57.73,58.04],[58.04,58.48],[58.48,58.78],[58.78,59.6],[59.6,59.86],[59.86,60.32],[60.32,60.76],[60.76,61.24],[61.24,61.64],[61.64,62.08],[62.08,62.76],[62.76,63.16],[63.16,63.66],[64.54,64.72],[64.72,64.96],[64.96,65.36],[65.36,65.84],[65.84,66.08],[66.08,66.34],[66.34,66.7],[66.7,66.98],[66.98,67.38],[67.9,68.04],[68.04,68.3],[68.3,68.54],[68.54,68.86],[68.86,69.36],[69.36,69.39],[69.39,69.52],[69.52,69.76],[69.76,69.94],[69.94,70.2],[70.2,70.64],[71.36,71.68],[71.68,72.04],[72.04,72.5],[73.1,73.48],[73.48,73.82],[73.82,74.28],[74.8,75.08],[75.08,75.38],[75.38,75.74],[76.08,76.32],[76.32,76.44],[76.44,76.68],[76.68,76.94],[76.94,77.48],[77.48,77.52],[77.52,77.74],[77.74,78.08],[78.08,78.48],[78.48,78.8],[78.8,79.28],[80.08,80.3],[80.3,80.7],[80.7,81.08],[81.08,81.38],[81.38,81.62],[81.62,81.84],[81.84,82.06],[82.06,82.32],[82.32,82.62],[82.62,83.24],[83.24,83.82],[83.82,84.12],[84.12,84.34],[84.34,84.68],[85.42,85.8],[85.8,86.06],[86.06,86.44],[86.44,86.72],[86.72,86.98],[86.98,87.26],[87.26,87.46],[87.46,87.74],[88.02,88.18],[88.18,88.4],[88.4,88.66],[88.66,89.1],[89.1,89.4],[89.4,89.62],[89.62,89.94],[89.94,90.24],[90.24,90.5],[90.5,91.08],[91.86,92.08],[92.08,92.68],[92.68,92.7],[92.7,92.94],[92.94,93.36],[93.36,93.58],[93.58,93.9],[93.9,94.36],[94.36,94.4],[94.4,94.66],[94.66,95.06],[95.36,95.52],[95.52,95.76],[95.76,95.96],[95.96,96.22],[96.22,96.5],[96.5,96.84],[96.84,97.1],[97.1,97.7],[98.14,98.3],[98.3,98.62],[98.62,99.1],[99.1,99.78],[99.78,100.04],[100.04,100.28],[100.28,100.5],[100.5,100.88],[101.2,101.4],[101.4,101.68],[101.68,102],[102.24,102.38],[102.38,102.64],[102.64,103.02],[103.02,103.56],[104.2,104.58],[104.64,104.88],[104.88,105.24],[105.4,105.54],[105.54,105.76],[105.76,105.88],[105.88,106.7],[106.7,107.06],[107.06,107.09],[107.09,107.26],[107.26,107.48],[107.48,107.76],[107.76,108.34],[108.34,108.54],[108.54,108.68],[108.68,108.98],[108.98,109.3],[109.3,109.62],[109.62,110],[110.64,110.86],[110.86,111.1],[111.1,111.46],[111.46,111.66],[111.66,111.88],[111.88,112.06],[112.06,112.92],[112.92,113.22],[113.22,113.58],[113.58,113.78],[113.78,114.3],[114.46,114.5],[114.5,114.76],[114.76,115.02],[115.02,115.26],[115.26,115.48],[115.48,115.92]]
        },
        "title": "第二列",
        "theme": {
          "zh": "贵族觉醒",
          "en": "An Aristocrat Resigns Privilege for Solidarity"
        },
        "words": [
          {
            "id": "s5col2-frontier",
            "word": "frontier",
            "pos": "n.",
            "meaning": "边疆；前沿"
          },
          {
            "id": "s5col2-consent",
            "word": "consent",
            "pos": "n.",
            "meaning": "同意；许可"
          },
          {
            "id": "s5col2-perish",
            "word": "perish",
            "pos": "v.",
            "meaning": "丧生；毁灭"
          },
          {
            "id": "s5col2-postgraduate",
            "word": "postgraduate",
            "pos": "adj.",
            "meaning": "研究生的；大学毕业后的"
          },
          {
            "id": "s5col2-irreversible",
            "word": "irreversible",
            "pos": "adj.",
            "meaning": "不可逆的；无法挽回的"
          },
          {
            "id": "s5col2-expenditure",
            "word": "expenditure",
            "pos": "n.",
            "meaning": "支出；花费"
          },
          {
            "id": "s5col2-loom",
            "word": "loom",
            "pos": "v.",
            "meaning": "隐约浮现；逼近"
          },
          {
            "id": "s5col2-lure",
            "word": "lure",
            "pos": "n.",
            "meaning": "诱惑；吸引力"
          },
          {
            "id": "s5col2-equity",
            "word": "equity",
            "pos": "n.",
            "meaning": "公正；公平"
          },
          {
            "id": "s5col2-resign",
            "word": "resign",
            "pos": "v.",
            "meaning": "辞去；放弃"
          },
          {
            "id": "s5col2-aristocrat",
            "word": "aristocrat",
            "pos": "n.",
            "meaning": "贵族"
          },
          {
            "id": "s5col2-patron",
            "word": "patron",
            "pos": "n.",
            "meaning": "赞助人；庇护者"
          },
          {
            "id": "s5col2-carton",
            "word": "carton",
            "pos": "n.",
            "meaning": "纸板箱"
          },
          {
            "id": "s5col2-takeover",
            "word": "takeover",
            "pos": "n.",
            "meaning": "接管；夺取"
          },
          {
            "id": "s5col2-vicious",
            "word": "vicious",
            "pos": "adj.",
            "meaning": "凶残的；恶毒的"
          },
          {
            "id": "s5col2-orthodox",
            "word": "orthodox",
            "pos": "adj.",
            "meaning": "正统的；传统的"
          },
          {
            "id": "s5col2-portrait",
            "word": "portrait",
            "pos": "n.",
            "meaning": "肖像；画像"
          },
          {
            "id": "s5col2-idealistic",
            "word": "idealistic",
            "pos": "adj.",
            "meaning": "理想主义的"
          },
          {
            "id": "s5col2-turbulent",
            "word": "turbulent",
            "pos": "adj.",
            "meaning": "动荡的；骚乱的"
          },
          {
            "id": "s5col2-solidarity",
            "word": "solidarity",
            "pos": "n.",
            "meaning": "团结"
          },
          {
            "id": "s5col2-extinguish",
            "word": "extinguish",
            "pos": "v.",
            "meaning": "熄灭；扑灭"
          },
          {
            "id": "s5col2-renovation",
            "word": "renovation",
            "pos": "n.",
            "meaning": "翻修；改造"
          },
          {
            "id": "s5col2-soak",
            "word": "soak",
            "pos": "v.",
            "meaning": "浸透；渗透"
          },
          {
            "id": "s5col2-trickle",
            "word": "trickle",
            "pos": "v.",
            "meaning": "滴流；缓缓渗入"
          },
          {
            "id": "s5col2-eccentric",
            "word": "eccentric",
            "pos": "adj.",
            "meaning": "古怪的；异乎寻常的"
          },
          {
            "id": "s5col2-hygiene",
            "word": "hygiene",
            "pos": "n.",
            "meaning": "卫生"
          },
          {
            "id": "s5col2-confer",
            "word": "confer",
            "pos": "v.",
            "meaning": "商讨；交谈"
          },
          {
            "id": "s5col2-manuscript",
            "word": "manuscript",
            "pos": "n.",
            "meaning": "手稿；原稿"
          },
          {
            "id": "s5col2-stall",
            "word": "stall",
            "pos": "v.",
            "meaning": "拖延；使停顿"
          },
          {
            "id": "s5col2-dessert",
            "word": "dessert",
            "pos": "n.",
            "meaning": "甜点"
          },
          {
            "id": "s5col2-descend",
            "word": "descend",
            "pos": "v.",
            "meaning": "走下；下降"
          },
          {
            "id": "s5col2-aloof",
            "word": "aloof",
            "pos": "adj.",
            "meaning": "冷漠的；超然的"
          },
          {
            "id": "s5col2-drawback",
            "word": "drawback",
            "pos": "n.",
            "meaning": "缺点；不利之处"
          }
        ],
        "paragraphs": [
          {
            "id": "s5col2-p1",
            "segments": [
              "The ",
              {
                "vocabId": "s5col2-portrait",
                "text": "portrait"
              },
              " on the wall showed a young ",
              {
                "vocabId": "s5col2-aristocrat",
                "text": "aristocrat"
              },
              " in tailored silk—born to ",
              {
                "vocabId": "s5col2-descend",
                "text": "descend"
              },
              " a grand staircase each morning, ",
              {
                "vocabId": "s5col2-aloof",
                "text": "aloof"
              },
              " from the hunger gnawing below. Yet something in that painted smile concealed an ",
              {
                "vocabId": "s5col2-idealistic",
                "text": "idealistic"
              },
              " restlessness no inheritance could quiet."
            ],
            "analysis": {
              "translation": "墙上的肖像画展示了一位身穿定制丝绸的年轻贵族——生来每天早晨走下宏伟的楼梯，对楼下蔓延的饥饿漠不关心。然而那画中的微笑里，某种东西隐藏着任何遗产都无法平息的理想主义躁动。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “墙上的肖像画展示了一位身穿定制丝绸的年轻贵族——生…” → “那画中的微笑里，某种东西隐藏着任何遗产都无法平息的…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"The portrait on the wall showed a young aristocrat in tailored silk\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">过去分词短语</span>：born to descend a grand staircase each morning 作后置定语/补充说明，修饰aristocrat。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">aloof from</span> 远离、对……冷漠，aloof from the hunger gnawing below 表示“对楼下蔓延的饥饿漠不关心”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语gnawing below作后置定语，修饰hunger，表示“在下面啃噬的”。",
                "<span class=\"keyword\">句子骨架</span>：该句由Yet连接表转折，主干为\"something... concealed an idealistic restlessness\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句（省略that）</span>：(that) no inheritance could quiet 修饰restlessness，省略了关系代词that/which。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">quiet</span> 此处作动词意为“平息、使安静”，no inheritance could quiet 意为“任何遗产都无法平息”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">tailored silk</span> 定制的丝绸，tailored为过去分词作定语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：portrait 出现在“The portrait on the wall”中，本段取“肖像”义；aristocrat 出现在“a young aristocrat in tailored silk”中，本段取“贵族”义；descend 出现在“born to descend a grand staircase”中，本段取“走下”义；aloof 出现在“aloof from the hunger”中，本段取“冷漠的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col2-p2",
            "segments": [
              "After finishing his ",
              {
                "vocabId": "s5col2-postgraduate",
                "text": "postgraduate"
              },
              " studies in political philosophy, he watched privation ",
              {
                "vocabId": "s5col2-trickle",
                "text": "trickle"
              },
              " through the city slums while lords casually debated ",
              {
                "vocabId": "s5col2-expenditure",
                "text": "expenditure"
              },
              " on banquets and hunts. The contrast became a ",
              {
                "vocabId": "s5col2-drawback",
                "text": "drawback"
              },
              " of his birth he could no longer ignore. He decided to ",
              {
                "vocabId": "s5col2-resign",
                "text": "resign"
              },
              " his title, knowing the choice was ",
              {
                "vocabId": "s5col2-irreversible",
                "text": "irreversible"
              },
              "."
            ],
            "analysis": {
              "translation": "在完成政治哲学的研究生学业后，他看着贫困渗过城市的贫民窟，而贵族们却随意辩论着宴会和狩猎的开支。这种反差成了他无法再忽视的与生俱来的负担。他决定辞去自己的头衔，深知这个选择是不可逆的。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在完成政治哲学的研究生学业后，他看着贫困渗过城市的…” → “这种反差成了他无法再忽视的与生俱来的负担” → “他决定辞去自己的头衔，深知这个选择是不可逆的” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">时间状语</span>：After finishing his postgraduate studies in political philosophy 为After+动名词作时间状语。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">trickle through</span> 渗过、缓缓流过，watched privation trickle through the city slums 中trickle为宾语补足语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">时间/对比状语从句</span>：while lords casually debated expenditure on banquets and hunts，由while引导，表示“而与此同时”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">expenditure on</span> 在……上的开支/支出，expenditure on banquets and hunts 意为“宴会和狩猎的开支”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">定语从句（省略that）</span>：(that) he could no longer ignore 修饰drawback，省略了关系代词。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">resign one's title</span> 辞去头衔，decided to resign his title 意为“决定辞去头衔”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语knowing the choice was irreversible作伴随状语，其中the choice was irreversible为宾语从句（省略that）。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">irreversible</span> 不可逆的、不可撤销的，前缀ir-+reverse+ible。",
                "<span class=\"keyword\">语境搭配</span>：postgraduate 出现在“finishing his postgraduate studies in political”中，本段取“研究生的”义；trickle 出现在“watched privation trickle through the city”中，本段取“滴流”义；expenditure 出现在“casually debated expenditure on banquets and”中，本段取“支出”义；drawback 出现在“became a drawback of his birth”中，本段取“缺点”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col2-p3",
            "segments": [
              "His father, a proud ",
              {
                "vocabId": "s5col2-patron",
                "text": "patron"
              },
              " of ",
              {
                "vocabId": "s5col2-orthodox",
                "text": "orthodox"
              },
              " tradition, refused ",
              {
                "vocabId": "s5col2-consent",
                "text": "consent"
              },
              ". \"You would ",
              {
                "vocabId": "s5col2-perish",
                "text": "perish"
              },
              " out there,\" he warned, predicting a ",
              {
                "vocabId": "s5col2-vicious",
                "text": "vicious"
              },
              "\n",
              {
                "vocabId": "s5col2-takeover",
                "text": "takeover"
              },
              " by lawless mobs. But the young man would not let fear ",
              {
                "vocabId": "s5col2-stall",
                "text": "stall"
              },
              " his conscience. He packed a single ",
              {
                "vocabId": "s5col2-carton",
                "text": "carton"
              },
              " of belongings and slipped away at dawn."
            ],
            "analysis": {
              "translation": "他的父亲——正统传统的骄傲守护者——拒绝了同意。“你在外面会送命的，”他警告道，预言暴民会进行恶毒的接管。但这个年轻人不让恐惧阻碍他的良知。他装了一纸箱的物品，在黎明时分悄然离去。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他的父亲——正统传统的骄傲守护者——拒绝了同意” → “这个年轻人不让恐惧阻碍他的良知” → “他装了一纸箱的物品，在黎明时分悄然离去” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">同位语</span>：a proud patron of orthodox tradition 为His father的同位语，补充身份。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">patron</span> 赞助人、守护者，patron of orthodox tradition 意为“正统传统的守护者”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">refuse consent</span> 拒绝同意，refused consent 意为“拒绝给予同意”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">虚拟语气</span>：You would perish out there，would perish表示对将来的假设，意为“你会送命”。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语predicting a vicious takeover by lawless mobs作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">let + 宾语 + 宾补</span>：let fear stall his conscience，stall为省略to的不定式作宾语补足语。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">stall</span> 阻碍、拖延，let fear stall his conscience 意为“让恐惧阻碍良知”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">slip away</span> 悄然离去、溜走，slipped away at dawn 意为“在黎明时悄然离去”。",
                "<span class=\"keyword\">语境搭配</span>：patron 出现在“a proud patron of orthodox tradition”中，本段取“赞助人”义；orthodox 出现在“patron of orthodox tradition”中，本段取“正统的”义；consent 出现在“refused consent”中，本段取“同意”义；perish 出现在“You would perish out there”中，本段取“丧生”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col2-p4",
            "segments": [
              "Beyond the ",
              {
                "vocabId": "s5col2-frontier",
                "text": "frontier"
              },
              ", a ",
              {
                "vocabId": "s5col2-turbulent",
                "text": "turbulent"
              },
              " movement was rising—farmers and laborers demanding ",
              {
                "vocabId": "s5col2-equity",
                "text": "equity"
              },
              " and ",
              {
                "vocabId": "s5col2-solidarity",
                "text": "solidarity"
              },
              " against corrupt landlords. Clouds of revolution seemed to ",
              {
                "vocabId": "s5col2-loom",
                "text": "loom"
              },
              " over every village, yet the cause acted as a ",
              {
                "vocabId": "s5col2-lure",
                "text": "lure"
              },
              " he could not resist."
            ],
            "analysis": {
              "translation": "在边境之外，一场动荡的运动正在兴起——农民和劳工要求公平和团结以对抗腐败的地主。革命的乌云似乎笼罩着每个村庄，然而这项事业成了他无法抗拒的诱惑。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在边境之外，一场动荡的运动正在兴起——农民和劳工要…” → “革命的乌云似乎笼罩着每个村庄，然而这项事业成了他无…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">介词短语作地点状语</span>：Beyond the frontier 置于句首，表示“在边境之外”。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为\"a turbulent movement was rising\"，破折号后farmers and laborers... 为movement的同位语/解释说明。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语demanding equity and solidarity against corrupt landlords作后置定语，修饰farmers and laborers。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">equity and solidarity</span> 公平与团结，demanding equity and solidarity 意为“要求公平和团结”。",
                "<span class=\"keyword\">语境辨析</span>：<span class=\"keyword\">隐喻</span>：Clouds of revolution，将革命比作乌云，为隐喻修辞。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">loom over</span> 笼罩于……之上，seemed to loom over every village 意为“似乎笼罩每个村庄”。",
                "<span class=\"keyword\">句子骨架</span>：该句由yet连接表转折，主干为\"the cause acted as a lure\"。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">act as</span> 充当、作为，acted as a lure 意为“充当诱惑”。<span class=\"keyword\">定语从句（省略that）</span>：(that) he could not resist 修饰lure，省略了关系代词。",
                "<span class=\"keyword\">语境搭配</span>：frontier 出现在“Beyond the frontier”中，本段取“边疆”义；turbulent 出现在“a turbulent movement was rising”中，本段取“动荡的”义；equity 出现在“laborers demanding equity and solidarity against”中，本段取“公正”义；solidarity 出现在“equity and solidarity against corrupt landlords”中，本段取“团结”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col2-p5",
            "segments": [
              "Conditions were grim. ",
              {
                "vocabId": "s5col2-hygiene",
                "text": "Hygiene"
              },
              " was poor, meals were thin, and the only ",
              {
                "vocabId": "s5col2-dessert",
                "text": "dessert"
              },
              " was a shared apple passed among comrades. An ",
              {
                "vocabId": "s5col2-eccentric",
                "text": "eccentric"
              },
              " old printer let him edit a hand-set ",
              {
                "vocabId": "s5col2-manuscript",
                "text": "manuscript"
              },
              " calling for fair wages. Together they would ",
              {
                "vocabId": "s5col2-confer",
                "text": "confer"
              },
              " late into the night, while the damp began to ",
              {
                "vocabId": "s5col2-soak",
                "text": "soak"
              },
              " through their thin blankets."
            ],
            "analysis": {
              "translation": "条件很艰苦。卫生很差，饭菜稀少，唯一的甜点是同志们之间传递共享的一个苹果。一位古怪的老印刷工让他编辑一份手工排版、呼吁公平工资的手稿。他们一起商议到深夜，而潮气开始浸透他们单薄的毯子。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “条件很艰苦” → “一位古怪的老印刷工让他编辑一份手工排版、呼吁公平工…” → “他们一起商议到深夜，而潮气开始浸透他们单薄的毯子” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：该句为三个并列短句：Hygiene was poor, meals were thin, and the only dessert was a shared apple。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">grim</span> 严酷的、艰苦的，Conditions were grim 意为“条件艰苦”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">thin</span> 此处指“稀少的、不丰盛的”，meals were thin 意为“饭菜稀少”。",
                "<span class=\"keyword\">结构拆解</span>：过去分词短语passed among comrades作后置定语，修饰apple，表示“在同志间传递的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">eccentric</span> 古怪的、异乎寻常的，an eccentric old printer 意为“一位古怪的老印刷工”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">let + 宾语 + 宾补</span>：let him edit a hand-set manuscript，edit为省略to的不定式作宾语补足语。",
                "<span class=\"keyword\">结构拆解</span>：现在分词短语calling for fair wages作后置定语，修饰manuscript，<span class=\"keyword\">call for</span> 意为“呼吁、要求”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">confer</span> 商议、磋商，would confer late into the night 意为“商议到深夜”。<span class=\"keyword\">时间/对比状语从句</span>：while the damp began to soak through their thin blankets，由while引导，表示“而与此同时”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境搭配</span>：Hygiene 出现在“Hygiene was poor”中，本段取“卫生”义；dessert 出现在“the only dessert was a shared”中，本段取“甜点”义；eccentric 出现在“An eccentric old printer let”中，本段取“古怪的”义；manuscript 出现在“a hand-set manuscript calling for fair”中，本段取“手稿”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col2-p6",
            "segments": [
              "During the ",
              {
                "vocabId": "s5col2-renovation",
                "text": "renovation"
              },
              " of an abandoned barn into a meeting hall, he learned to carry timber like anyone else. He watched comrades ",
              {
                "vocabId": "s5col2-extinguish",
                "text": "extinguish"
              },
              " their lamps at midnight, rise at dawn, and labor without complaint. Privilege, he discovered, could be set aside—just as a flame could be snuffed—once the will to serve burned brighter."
            ],
            "analysis": {
              "translation": "在将一座废弃谷仓改造成会议厅的过程中，他学会了像其他人一样搬运木材。他看着同志们午夜熄灯，黎明起身，毫无怨言地劳作。他发现，特权可以被搁置——就像火焰可以被掐灭一样——只要服务的意志燃烧得更亮。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在将一座废弃谷仓改造成会议厅的过程中，他学会了像其…” → “他看着同志们午夜熄灯，黎明起身，毫无怨言地劳作” → “他发现，特权可以被搁置——就像火焰可以被掐灭一样—…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">介词短语作时间状语</span>：During the renovation of an abandoned barn into a meeting hall，表示“在改造……期间”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">renovation of A into B</span> 将A改造成B，renovation of an abandoned barn into a meeting hall 意为“将废弃谷仓改造成会议厅”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">方式状语</span>：like anyone else 表示“像其他人一样”。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">watch + 宾语 + 宾补</span>：watched comrades extinguish their lamps... rise... and labor...，三个并列省略to的不定式作宾语补足语。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">extinguish</span> 熄灭，extinguish their lamps 意为“熄灯”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">插入语</span>：he discovered 为插入成分，主句为Privilege could be set aside。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">方式状语从句</span>：just as a flame could be snuffed，由just as引导，表示“就像……一样”，为明喻。<span class=\"keyword\">snuff</span> 掐灭、熄灭。这里不是在补充事实，而是用类比或假设呈现人物感受，让画面和语气更鲜明。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">条件状语从句</span>：once the will to serve burned brighter，由once引导，表示“一旦……”，the will to serve burned brighter 为隐喻，将意志比作火焰。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境搭配</span>：renovation 出现在“During the renovation of an abandoned”中，本段取“翻修”义；extinguish 出现在“watched comrades extinguish their lamps at”中，本段取“熄灭”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col2-p7",
            "segments": [
              "He never returned to the manor. The ",
              {
                "vocabId": "s5col2-frontier",
                "text": "frontier"
              },
              " had claimed him, not by force but by conviction."
            ],
            "analysis": {
              "translation": "他再也没有回到那座庄园。边疆已经占据了他——不是靠武力，而是靠信念。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他再也没有回到那座庄园” → “边疆已经占据了他——不是靠武力，而是靠信念” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 <span class=\"keyword\">He never returned to the manor</span>，主谓结构 He returned，never 为频度副词修饰动词。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">not by force but by conviction</span> 中使用 not...but...（不是……而是……）结构，强调两种方式的对比。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：by force / by conviction 中 by 表示“凭借、通过”的方式，force 与 conviction 均为抽象名词作介词宾语。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The frontier had claimed him</span>，使用过去完成时 had claimed，表示在“回到庄园”之前边疆已经“占据”了他。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">claim</span> 此处意为“夺走、占据”，本义为“宣称”，在此引申为边疆对人产生深刻影响并使其留下。",
                "<span class=\"keyword\">地道表达</span>：破折号后的 <span class=\"keyword\">not by force but by conviction</span> 作方式状语，补充说明 claim 的方式，conviction 意为“信念”。",
                "<span class=\"keyword\">语境搭配</span>：frontier 出现在“The frontier had claimed him”中，本段取“边疆”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s5col3",
        "number": 3,
        "audio": {
          "src": "audio/list5_col3.mp3",
          "cues": [[2.68,3.52],[3.52,3.56],[3.56,3.9],[3.9,4.26],[4.26,4.66],[4.66,5.18],[5.18,5.58],[5.58,6.06],[6.06,6.1],[6.1,6.34],[6.34,6.8],[6.8,7.06],[7.06,7.3],[7.3,7.8],[7.8,8.32],[8.32,8.68],[8.68,8.9],[8.9,9.26],[9.26,9.29],[9.29,9.52],[9.52,10.2],[10.8,11],[11,11.48],[11.48,11.96],[11.96,12.4],[12.4,12.72],[12.72,13.08],[13.08,13.38],[13.38,13.84],[13.84,13.87],[13.87,14.06],[14.06,14.36],[15.08,15.3],[15.3,15.76],[15.76,16.08],[16.08,16.28],[16.28,16.52],[16.52,16.94],[17.42,17.44],[17.44,17.8],[17.8,18.34],[18.34,18.88],[18.88,19.12],[19.12,19.56],[20.2,20.42],[20.42,20.78],[20.94,21.08],[21.08,21.3],[21.3,21.58],[21.58,22.36],[22.36,22.39],[22.39,22.56],[22.56,22.82],[22.82,23.3],[23.3,23.92],[23.92,24.4],[24.82,25.02],[25.02,25.52],[25.52,26.12],[26.46,26.7],[26.7,27.02],[27.02,27.32],[27.32,27.64],[27.64,28.02],[28.02,28.72],[28.72,29.34],[29.34,29.8],[29.8,30.2],[30.2,30.42],[30.42,30.84],[30.84,31.08],[31.08,31.7],[32.44,32.46],[32.46,32.96],[32.96,33.42],[33.88,34],[34,34.36],[34.36,34.7],[34.7,35.12],[35.84,35.98],[35.98,36.38],[36.38,36.76],[36.76,36.98],[36.98,37.38],[37.38,37.4],[37.4,37.6],[37.6,37.98],[37.98,38.24],[38.24,38.56],[38.56,39.12],[39.94,40.12],[40.12,40.3],[40.3,40.5],[40.5,40.78],[40.78,41],[41,41.26],[41.26,41.66],[41.66,42.1],[42.1,42.26],[42.26,42.44],[42.44,42.72],[42.72,43.02],[43.02,43.32],[43.32,43.78],[43.78,43.96],[43.96,44.46],[45.08,45.32],[45.32,45.6],[45.6,46.06],[46.76,47.02],[47.02,47.52],[47.52,48.06],[48.06,48.36],[48.58,48.74],[48.74,48.88],[48.88,49.18],[49.18,49.48],[49.48,49.68],[49.68,50.08],[50.52,50.8],[50.8,51.08],[51.08,51.46],[51.46,51.86],[52.62,52.78],[52.78,53.2],[53.36,53.54],[53.54,53.82],[53.82,54.16],[54.16,54.46],[54.46,54.8],[55,55.26],[55.26,55.7],[55.7,56.22],[56.86,57.2],[57.2,57.23],[57.23,57.38],[57.38,57.78],[57.78,58.14],[58.46,58.6],[58.6,58.74],[58.74,58.98],[58.98,59.08],[59.08,59.32],[59.32,59.56],[59.56,59.9],[59.9,60.32],[60.32,60.6],[60.6,61.12],[61.76,61.98],[61.98,62.38],[62.38,62.82],[62.82,62.92],[62.92,63.3],[63.3,63.62],[64.18,64.3],[64.3,64.54],[64.54,64.76],[64.76,65.08],[65.08,65.58],[65.58,65.84],[65.84,66.54],[66.54,66.8],[66.8,67.02],[67.02,67.28],[67.28,67.46],[67.46,67.98],[68.18,68.38],[68.38,68.66],[68.66,68.96],[68.96,69.7],[70.22,70.34],[70.34,70.56],[70.56,70.76],[70.76,71.18],[71.18,71.64],[71.64,71.88],[71.88,72.3],[72.56,72.8],[72.8,73.3],[73.3,73.82],[73.82,74.18],[74.18,74.38],[74.38,74.5],[74.5,74.72],[74.72,75.04],[75.74,75.98],[75.98,76.38],[76.38,76.7],[76.7,77.04],[77.04,77.38],[77.56,77.74],[77.74,77.88],[77.88,78.04],[78.04,78.44],[78.44,78.84],[78.84,79.24],[79.24,79.66],[79.76,80],[80,80.14],[80.14,80.3],[80.3,80.56],[80.56,80.86],[81.48,81.7],[81.7,82],[82,82.3],[82.3,82.64],[82.64,82.78],[82.78,82.92],[82.92,83.16],[83.16,83.5],[83.5,83.92],[84.3,84.5],[84.5,84.96],[84.96,85.38],[85.38,85.84],[85.84,86.24],[86.24,86.46],[86.46,86.9],[87.38,87.64],[87.64,87.98],[87.98,88.46],[88.46,88.8],[88.8,89.2],[89.2,89.68],[90.34,90.52],[90.52,90.9],[90.9,91.14],[91.14,91.56],[91.56,91.59],[91.59,91.9],[91.9,92.34],[92.34,92.72],[93.06,93.24],[93.24,93.42],[93.42,93.96],[93.96,94.32],[94.32,94.68],[94.68,95.04],[95.04,95.44],[95.44,95.72],[96.24,96.36],[96.36,96.64],[96.64,96.94],[96.94,97.18],[97.18,97.52],[97.52,97.74],[97.74,98.08],[98.08,98.13],[98.13,98.32],[98.92,99.14],[99.14,99.38],[99.38,99.62],[99.62,100.64],[100.64,100.88],[100.88,101.16],[101.88,102.1],[102.1,102.36],[102.36,102.66],[102.66,103.02],[103.02,103.36],[103.7,103.84],[103.84,104.36],[104.36,104.38],[104.38,104.52],[104.52,104.84],[104.84,105.36],[105.36,106.04],[106.7,106.96],[106.96,107.26],[107.26,107.68],[107.68,107.98],[107.98,108.7],[108.7,108.73],[108.73,109.02],[109.02,109.32],[109.32,109.62],[109.62,110.02],[110.02,110.42],[110.92,111.3],[111.3,111.6],[111.6,111.88],[111.88,112.22],[112.22,112.5],[112.5,112.68],[112.68,113.16],null,[113.74,113.96],[113.96,114.36],[114.36,114.72],[114.72,115.2],[115.2,115.27],[115.27,115.48],[115.48,115.82],[115.82,116.2],[116.2,116.68],[117.48,117.74],[117.74,118.06],[118.06,118.24],[118.24,118.58],[118.58,119.1],[119.1,119.15],[119.15,119.54],[119.54,119.9],[120.64,120.78],[120.78,120.96],[120.96,121.16],[121.16,121.4],[121.4,121.76],[121.76,122.02],[122.02,122.38],[122.38,122.7],[122.7,123.1],[123.1,123.34],[123.34,123.58],[123.58,123.78],[124.04,124.06],[124.06,124.28],[124.28,124.58],[124.58,124.76]]
        },
        "title": "第三列",
        "theme": {
          "zh": "沙漠迷途",
          "en": "A Carefree Merchant's Miraculous Escape"
        },
        "words": [
          {
            "id": "s5col3-masculine",
            "word": "masculine",
            "pos": "adj.",
            "meaning": "男性的；阳刚的"
          },
          {
            "id": "s5col3-caravan",
            "word": "caravan",
            "pos": "n.",
            "meaning": "商队；旅行队"
          },
          {
            "id": "s5col3-shrewdly",
            "word": "shrewdly",
            "pos": "adv.",
            "meaning": "精明地；机敏地"
          },
          {
            "id": "s5col3-lucrative",
            "word": "lucrative",
            "pos": "adj.",
            "meaning": "获利丰厚的；有利可图的"
          },
          {
            "id": "s5col3-disposable",
            "word": "disposable",
            "pos": "adj.",
            "meaning": "一次性的；可丢弃的"
          },
          {
            "id": "s5col3-ayes",
            "word": "ayes",
            "pos": "n.",
            "meaning": "赞成票；同意"
          },
          {
            "id": "s5col3-aversion",
            "word": "aversion",
            "pos": "n.",
            "meaning": "厌恶；反感"
          },
          {
            "id": "s5col3-sin",
            "word": "sin",
            "pos": "n.",
            "meaning": "罪恶；罪过"
          },
          {
            "id": "s5col3-imprison",
            "word": "imprison",
            "pos": "v.",
            "meaning": "监禁；关押"
          },
          {
            "id": "s5col3-jeopardy",
            "word": "jeopardy",
            "pos": "n.",
            "meaning": "危险；危难"
          },
          {
            "id": "s5col3-scepticism",
            "word": "scepticism",
            "pos": "n.",
            "meaning": "怀疑；怀疑态度"
          },
          {
            "id": "s5col3-contemplate",
            "word": "contemplate",
            "pos": "v.",
            "meaning": "沉思；深思"
          },
          {
            "id": "s5col3-compile",
            "word": "compile",
            "pos": "v.",
            "meaning": "收集；编纂"
          },
          {
            "id": "s5col3-preferable",
            "word": "preferable",
            "pos": "adj.",
            "meaning": "更可取的；更合意的"
          },
          {
            "id": "s5col3-fabricate",
            "word": "fabricate",
            "pos": "v.",
            "meaning": "编造；捏造"
          },
          {
            "id": "s5col3-detriment",
            "word": "detriment",
            "pos": "n.",
            "meaning": "损害；不利"
          },
          {
            "id": "s5col3-carefree",
            "word": "carefree",
            "pos": "adj.",
            "meaning": "无忧无虑的"
          },
          {
            "id": "s5col3-ventilate",
            "word": "ventilate",
            "pos": "v.",
            "meaning": "使通风；使空气流通"
          },
          {
            "id": "s5col3-optimal",
            "word": "optimal",
            "pos": "adj.",
            "meaning": "最佳的；最适宜的"
          },
          {
            "id": "s5col3-restless",
            "word": "restless",
            "pos": "adj.",
            "meaning": "烦躁不安的；坐立不安的"
          },
          {
            "id": "s5col3-prerequisite",
            "word": "prerequisite",
            "pos": "n.",
            "meaning": "先决条件；前提"
          },
          {
            "id": "s5col3-outbreak",
            "word": "outbreak",
            "pos": "n.",
            "meaning": "爆发；突然发生"
          },
          {
            "id": "s5col3-lane",
            "word": "lane",
            "pos": "n.",
            "meaning": "小巷；窄路"
          },
          {
            "id": "s5col3-vacancy",
            "word": "vacancy",
            "pos": "n.",
            "meaning": "空缺；空位"
          },
          {
            "id": "s5col3-maim",
            "word": "maim",
            "pos": "v.",
            "meaning": "使残废；使受重伤"
          },
          {
            "id": "s5col3-malnutrition",
            "word": "malnutrition",
            "pos": "n.",
            "meaning": "营养不良"
          },
          {
            "id": "s5col3-plight",
            "word": "plight",
            "pos": "n.",
            "meaning": "困境；苦境"
          },
          {
            "id": "s5col3-divine",
            "word": "divine",
            "pos": "adj.",
            "meaning": "神圣的；神的"
          },
          {
            "id": "s5col3-irresistible",
            "word": "irresistible",
            "pos": "adj.",
            "meaning": "不可抗拒的；无法抵挡的"
          },
          {
            "id": "s5col3-miraculous",
            "word": "miraculous",
            "pos": "adj.",
            "meaning": "奇迹般的；不可思议的"
          },
          {
            "id": "s5col3-prevalence",
            "word": "prevalence",
            "pos": "n.",
            "meaning": "普遍；盛行"
          },
          {
            "id": "s5col3-inanimate",
            "word": "inanimate",
            "pos": "adj.",
            "meaning": "无生命的；无生气的"
          },
          {
            "id": "s5col3-reluctance",
            "word": "reluctance",
            "pos": "n.",
            "meaning": "不情愿；勉强"
          }
        ],
        "paragraphs": [
          {
            "id": "s5col3-p1",
            "segments": [
              "Once a ",
              {
                "vocabId": "s5col3-carefree",
                "text": "carefree"
              },
              " merchant named Elias traveled with a ",
              {
                "vocabId": "s5col3-caravan",
                "text": "caravan"
              },
              " across the desert, trading spices and silks in a ",
              {
                "vocabId": "s5col3-lucrative",
                "text": "lucrative"
              },
              " business. His ",
              {
                "vocabId": "s5col3-masculine",
                "text": "masculine"
              },
              " frame and confident stride made him a natural leader. He ",
              {
                "vocabId": "s5col3-shrewdly",
                "text": "shrewdly"
              },
              " bargained at every market, turning even ",
              {
                "vocabId": "s5col3-disposable",
                "text": "disposable"
              },
              " trinkets into profit."
            ],
            "analysis": {
              "translation": "从前，一位名叫伊莱亚斯的无忧无虑的商人随商队穿越沙漠，做着香料和丝绸的赚钱生意。他魁梧的身躯和自信的步伐使他成为天生的领导者。他在每个市场都精明地讨价还价，甚至把不值钱的小玩意儿也变成了利润。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “从前，一位名叫伊莱亚斯的无忧无虑的商人随商队穿越沙…” → “他魁梧的身躯和自信的步伐使他成为天生的领导者” → “他在每个市场都精明地讨价还价，甚至把不值钱的小玩意…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 <span class=\"keyword\">a carefree merchant named Elias traveled with a caravan</span>，主语 merchant，谓语 traveled，Once 置于句首作时间状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">named Elias</span> 为过去分词短语作后置定语，修饰 merchant，相当于定语从句 who was named Elias。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">trading spices and silks in a lucrative business</span> 为现在分词短语作伴随状语，表示与 traveled 同时发生的动作。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">His masculine frame and confident stride made him a natural leader</span>，make sb. sth. 结构中 a natural leader 作宾语补足语。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">He shrewdly bargained at every market</span>，shrewdly 为副词修饰 bargained。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">turning even disposable trinkets into profit</span> 为现在分词短语作伴随状语，turn...into...（把……变成……）为固定搭配，disposable 意为“用完即弃的、不值钱的”。",
                "<span class=\"keyword\">语境搭配</span>：carefree 出现在“Once a carefree merchant named Elias”中，本段取“无忧无虑的”义；caravan 出现在“with a caravan across the desert”中，本段取“商队”义；lucrative 出现在“in a lucrative business”中，本段取“获利丰厚的”义；masculine 出现在“His masculine frame and confident”中，本段取“男性的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col3-p2",
            "segments": [
              "One evening, as the caravan entered a narrow ",
              {
                "vocabId": "s5col3-lane",
                "text": "lane"
              },
              " between sandstone cliffs, bandits ambushed them. The ",
              {
                "vocabId": "s5col3-outbreak",
                "text": "outbreak"
              },
              " of violence was sudden—arrows whistled, threatening to ",
              {
                "vocabId": "s5col3-maim",
                "text": "maim"
              },
              " anyone in range. Several guards fell, and Elias was captured. The bandits dragged him to a fortress to ",
              {
                "vocabId": "s5col3-imprison",
                "text": "imprison"
              },
              " him indefinitely."
            ],
            "analysis": {
              "translation": "一天傍晚，当商队进入砂岩峭壁之间的一条狭窄小道时，强盗伏击了他们。暴力的爆发突如其来——箭矢呼啸而过，威胁着要伤害射程内的任何人。几名护卫倒下了，伊莱亚斯被俘。强盗们把他拖到一个堡垒里，要无限期地关押他。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “一天傍晚，当商队进入砂岩峭壁之间的一条狭窄小道时，…” → “几名护卫倒下了，伊莱亚斯被俘” → “强盗们把他拖到一个堡垒里，要无限期地关押他” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">as the caravan entered a narrow lane between sandstone cliffs</span> 为时间状语从句，as 意为“当……时”，主句为 bandits ambushed them。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 <span class=\"keyword\">The outbreak of violence was sudden</span>，主系表结构，outbreak 意为“爆发”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">threatening to maim anyone in range</span> 为现在分词短语作伴随状语，threaten to do sth.（威胁做某事），maim 意为“使致残、伤害”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">逻辑衔接</span>：第三句为并列复合句 <span class=\"keyword\">Several guards fell, and Elias was captured</span>，由 and 连接两个并列分句，后者使用被动语态 was captured。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">to imprison him indefinitely</span> 为动词不定式短语作目的状语，imprison 意为“监禁”，indefinitely 为副词意为“无限期地”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">语境搭配</span>：lane 出现在“a narrow lane between sandstone cliffs”中，本段取“小巷”义；outbreak 出现在“The outbreak of violence was”中，本段取“爆发”义；maim 出现在“threatening to maim anyone in range”中，本段取“使残废”义；imprison 出现在“fortress to imprison him indefinitely”中，本段取“监禁”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col3-p3",
            "segments": [
              "His cell had no window to ",
              {
                "vocabId": "s5col3-ventilate",
                "text": "ventilate"
              },
              " it, and the stale air worsened his ",
              {
                "vocabId": "s5col3-restless",
                "text": "restless"
              },
              " nights. Food was scarce; soon ",
              {
                "vocabId": "s5col3-malnutrition",
                "text": "malnutrition"
              },
              " set in, to the ",
              {
                "vocabId": "s5col3-detriment",
                "text": "detriment"
              },
              " of his health. His ",
              {
                "vocabId": "s5col3-plight",
                "text": "plight"
              },
              " seemed hopeless. The jailers, with cruel ",
              {
                "vocabId": "s5col3-aversion",
                "text": "aversion"
              },
              " to prisoners, offered only scraps. When a fellow captive died, the ",
              {
                "vocabId": "s5col3-vacancy",
                "text": "vacancy"
              },
              " in the next cell went unfilled for weeks."
            ],
            "analysis": {
              "translation": "他的牢房没有窗户通风，浑浊的空气使他本就辗转难眠的夜晚更加难熬。食物匮乏；很快营养不良便袭来，损害了他的健康。他的处境似乎毫无希望。狱卒们对囚犯怀有残忍的厌恶，只给些残羹剩饭。当一名狱友死去时，隔壁牢房的空缺一连几周都没人填补。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他的牢房没有窗户通风，浑浊的空气使他本就辗转难眠的…” → “他的处境似乎毫无希望” → “当一名狱友死去时，隔壁牢房的空缺一连几周都没人填补” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：第一句主干为 <span class=\"keyword\">His cell had no window</span>，<span class=\"keyword\">to ventilate it</span> 为动词不定式短语作后置定语，修饰 window，表示“用来通风的窗户”。",
                "<span class=\"keyword\">逻辑衔接</span>：and 连接的并列句 <span class=\"keyword\">the stale air worsened his restless nights</span> 中，stale（浑浊的）和 restless（辗转难眠的）均为形容词作定语。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">to the detriment of his health</span> 为介词短语作结果状语，detriment 意为“损害”，to the detriment of 为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">The jailers offered only scraps</span>，<span class=\"keyword\">with cruel aversion to prisoners</span> 为介词短语作定语修饰 jailers，aversion 意为“厌恶”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">When a fellow captive died</span> 为时间状语从句，主句 the vacancy...went unfilled 中 went 为系动词，unfilled 为过去分词作表语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">for weeks</span> 为持续时间状语，went unfilled 表示“空着未被填补”的状态。",
                "<span class=\"keyword\">语境搭配</span>：ventilate 出现在“window to ventilate it”中，本段取“使通风”义；restless 出现在“worsened his restless nights”中，本段取“烦躁不安的”义；malnutrition 出现在“soon malnutrition set in”中，本段取“营养不良”义；detriment 出现在“to the detriment of his health”中，本段取“损害”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col3-p4",
            "segments": [
              "Elias began to ",
              {
                "vocabId": "s5col3-contemplate",
                "text": "contemplate"
              },
              " his fate. He tried to ",
              {
                "vocabId": "s5col3-compile",
                "text": "compile"
              },
              " fragments of memory—prayers his mother had taught him, stories of ",
              {
                "vocabId": "s5col3-divine",
                "text": "divine"
              },
              " deliverance. He felt an ",
              {
                "vocabId": "s5col3-irresistible",
                "text": "irresistible"
              },
              " urge to pray, though ",
              {
                "vocabId": "s5col3-scepticism",
                "text": "scepticism"
              },
              " whispered that no one was listening. Yet something stirred within him, not in the ",
              {
                "vocabId": "s5col3-inanimate",
                "text": "inanimate"
              },
              " stones around him, but in his own spirit."
            ],
            "analysis": {
              "translation": "伊莱亚斯开始思考自己的命运。他试图汇集记忆的碎片——母亲教过他的祈祷词，关于神灵救赎的故事。他感到一种不可抗拒的祈祷冲动，尽管怀疑的声音低语着说没有人在倾听。然而有什么东西在他内心涌动——不是在他周围冰冷的石头里，而是在他自己的灵魂深处。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “伊莱亚斯开始思考自己的命运” → “他感到一种不可抗拒的祈祷冲动，尽管怀疑的声音低语着…” → “有什么东西在他内心涌动——不是在他周围冰冷的石头里…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：第一句主干为 <span class=\"keyword\">Elias began to contemplate his fate</span>，begin to do sth.（开始做某事），contemplate 意为“思考、沉思”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">He tried to compile fragments of memory</span> 中 compile 意为“汇集、收集”，fragments of memory（记忆的碎片）为宾语。",
                "<span class=\"keyword\">结构拆解</span>：破折号后的 <span class=\"keyword\">prayers his mother had taught him</span> 为省略了 that 的定语从句，修饰 prayers，stories of divine deliverance 为并列同位语补充说明 fragments。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">though scepticism whispered that no one was listening</span> 为让步状语从句，其中 that no one was listening 为宾语从句作 whispered 的宾语。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">句子骨架</span>：第五句主干为 <span class=\"keyword\">something stirred within him</span>，<span class=\"keyword\">not in the inanimate stones...but in his own spirit</span> 使用 not...but...结构作地点状语，inanimate 意为“无生命的”。",
                "<span class=\"keyword\">语境搭配</span>：contemplate 出现在“began to contemplate his fate”中，本段取“沉思”义；compile 出现在“tried to compile fragments of memory”中，本段取“收集”义；divine 出现在“stories of divine deliverance”中，本段取“神圣的”义；irresistible 出现在“felt an irresistible urge to pray”中，本段取“不可抗拒的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col3-p5",
            "segments": [
              "The ",
              {
                "vocabId": "s5col3-prevalence",
                "text": "prevalence"
              },
              " of suffering in the prison was evident; many inmates showed ",
              {
                "vocabId": "s5col3-reluctance",
                "text": "reluctance"
              },
              " even to speak. But Elias refused to ",
              {
                "vocabId": "s5col3-fabricate",
                "text": "fabricate"
              },
              " despair. He believed hope was a ",
              {
                "vocabId": "s5col3-prerequisite",
                "text": "prerequisite"
              },
              " for survival, and that dignified silence was ",
              {
                "vocabId": "s5col3-preferable",
                "text": "preferable"
              },
              " to complaint. He gathered the prisoners and called for a vote; the ",
              {
                "vocabId": "s5col3-ayes",
                "text": "ayes"
              },
              " were unanimous—they would dig."
            ],
            "analysis": {
              "translation": "监狱中苦难的普遍存在是显而易见的；许多囚犯甚至不愿开口说话。但伊莱亚斯拒绝制造绝望。他相信希望是生存的前提，而有尊严的沉默胜过抱怨。他召集囚犯们进行投票；赞成声全票通过——他们要挖地道。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “监狱中苦难的普遍存在是显而易见的” → “他相信希望是生存的前提，而有尊严的沉默胜过抱怨” → “他召集囚犯们进行投票” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：第一句由分号连接两个并列分句，主干分别为 <span class=\"keyword\">The prevalence of suffering was evident</span> 和 <span class=\"keyword\">many inmates showed reluctance even to speak</span>。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">to speak</span> 为动词不定式作 reluctance 的后置定语，show reluctance to do sth.（不愿做某事）为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">Elias refused to fabricate despair</span>，fabricate 意为“捏造、制造”，refuse to do sth.（拒绝做某事）。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">He believed hope was a prerequisite for survival</span>，后接 <span class=\"keyword\">that dignified silence was preferable to complaint</span> 为宾语从句，be preferable to（胜过、比……更可取）为固定搭配。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">He gathered the prisoners and called for a vote</span> 为并列谓语，call for a vote 意为“要求投票”。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">the ayes were unanimous</span> 中 ayes 意为“赞成票”，unanimous 意为“一致的”，破折号后 they would dig 为结果说明。",
                "<span class=\"keyword\">语境搭配</span>：prevalence 出现在“The prevalence of suffering in”中，本段取“普遍”义；reluctance 出现在“inmates showed reluctance even to speak”中，本段取“不情愿”义；fabricate 出现在“refused to fabricate despair”中，本段取“编造”义；prerequisite 出现在“was a prerequisite for survival”中，本段取“先决条件”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col3-p6",
            "segments": [
              "Working in ",
              {
                "vocabId": "s5col3-jeopardy",
                "text": "jeopardy"
              },
              " of discovery, they carved a tunnel with improvised tools. The ",
              {
                "vocabId": "s5col3-optimal",
                "text": "optimal"
              },
              " moment came during a sandstorm that muffled all sound. What followed was nothing short of ",
              {
                "vocabId": "s5col3-miraculous",
                "text": "miraculous"
              },
              ": they emerged free beneath a sky blazing with stars."
            ],
            "analysis": {
              "translation": "他们在随时可能被发现的危险中作业，用临时拼凑的工具凿出一条隧道。最佳的时机出现在一场沙暴期间，沙暴掩盖了一切声响。接下来的事情简直堪称奇迹：他们在星光璀璨的天空下重获自由。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他们在随时可能被发现的危险中作业，用临时拼凑的工具…” → “最佳的时机出现在一场沙暴期间，沙暴掩盖了一切声响” → “下来的事情简直堪称奇迹：他们在星光璀璨的天空下重获…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">Working in jeopardy of discovery</span> 为现在分词短语作伴随/方式状语，in jeopardy of（处于……的危险中）为固定搭配，jeopardy 意为“危险”。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 <span class=\"keyword\">they carved a tunnel with improvised tools</span>，improvised 为过去分词作定语修饰 tools，意为“临时拼凑的”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The optimal moment came during a sandstorm</span>，<span class=\"keyword\">that muffled all sound</span> 为定语从句修饰 sandstorm，muffle 意为“掩盖、使声音低沉”。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">What followed was nothing short of miraculous</span>，<span class=\"keyword\">What followed</span> 为主语从句。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">nothing short of</span> 为固定搭配，意为“简直是、不亚于”，miraculous 意为“奇迹般的”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">they emerged free beneath a sky blazing with stars</span> 中 emerged 为系动词，free 作表语，<span class=\"keyword\">blazing with stars</span> 为现在分词短语作后置定语修饰 sky。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：jeopardy 出现在“Working in jeopardy of discovery”中，本段取“危险”义；optimal 出现在“The optimal moment came during”中，本段取“最佳的”义；miraculous 出现在“short of miraculous”中，本段取“奇迹般的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col3-p7",
            "segments": [
              "Elias had entered the desert a carefree trader. He left it knowing that ",
              {
                "vocabId": "s5col3-sin",
                "text": "sin"
              },
              " and cruelty could chain the body, but never the soul."
            ],
            "analysis": {
              "translation": "伊莱亚斯进入沙漠时还是一个无忧无虑的商人。他离开沙漠时懂得了：罪恶和残忍可以禁锢身体，却永远无法禁锢灵魂。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “伊莱亚斯进入沙漠时还是一个无忧无虑的商人” → “他离开沙漠时懂得了：罪恶和残忍可以禁锢身体，却永远…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：第一句主干为 <span class=\"keyword\">Elias had entered the desert a carefree trader</span>，a carefree trader 为名词短语作主语补足语（或视为状语），表示进入时的身份，使用过去完成时。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">He left it knowing that...</span>，<span class=\"keyword\">knowing that sin and cruelty could chain the body, but never the soul</span> 为现在分词短语作伴随状语。",
                "<span class=\"keyword\">句子骨架</span>：knowing 后接 <span class=\"keyword\">that</span> 引导的宾语从句，从句主干为 sin and cruelty could chain the body。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">but never the soul</span> 为省略结构，完整形式为 but could never chain the soul，使用 but 表转折。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">chain</span> 此处作动词，意为“禁锢、束缚”，本义为“用链子拴住”，此处为比喻用法。",
                "<span class=\"keyword\">语境搭配</span>：sin 出现在“knowing that sin and cruelty could”中，本段取“罪恶”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s5col4",
        "number": 4,
        "audio": {
          "src": "audio/list5_col4.mp3",
          "cues": [[2.76,2.96],[2.96,3],[3,3.24],[3.24,3.58],[3.58,3.92],[3.92,4.22],[4.22,4.5],[4.5,5.14],[5.14,5.58],[5.58,6.06],[6.06,6.42],[6.9,7],[7,7.36],[7.36,7.7],[7.7,8.1],[8.1,8.5],[9.22,9.44],[9.44,9.8],[9.8,10.34],null,[10.54,10.84],[10.84,11.2],[11.4,11.52],[11.52,11.88],[11.88,12.26],[12.26,12.76],[12.76,12.81],[12.81,13.02],[13.02,13.96],null,[13.96,14],[14,14.44],[14.44,14.8],[14.8,15.14],[15.14,15.4],[15.4,15.74],[15.74,16.04],[16.04,16.46],[16.46,16.7],[16.7,16.96],[16.96,17.54],[17.54,17.86],[17.86,18.24],[18.24,18.5],[18.5,18.92],[19.82,19.9],[19.9,20.18],[20.18,20.52],[20.52,20.86],[20.86,21.52],[22.12,22.34],[22.34,22.66],[22.66,22.92],[22.92,23.12],[23.12,23.58],[23.94,24.1],[24.1,24.3],[24.3,24.54],[24.54,24.76],[24.76,24.96],[24.96,25.26],[25.26,25.5],[25.5,25.82],[25.82,26],[26,26.18],[26.18,26.52],[26.52,26.8],[26.8,27.04],[27.04,27.4],[27.4,27.62],[27.62,27.96],[27.96,28.14],[28.14,28.6],[28.6,28.88],[28.88,29.16],[29.16,29.58],[29.58,29.94],[29.94,30.44],[30.44,30.62],[30.62,30.98],[30.98,31.4],[31.4,31.76],[31.76,32.06],[32.06,32.66],[33.4,33.54],[33.54,33.84],[33.84,34.18],[34.18,34.38],[34.38,34.6],[34.6,34.88],[34.88,35.62],[35.62,35.8],[35.8,36.4],[36.92,37.24],[37.24,37.28],[37.28,37.52],[37.52,37.86],[37.86,38.2],[38.2,38.62],[38.62,39.02],[39.02,39.42],[39.42,39.84],[39.84,40.24],[40.24,40.58],[41.2,41.42],[41.42,41.72],[41.72,42.16],[42.16,42.34],[42.34,42.8],[42.8,43.32],null,[43.66,43.9],[43.9,44.22],[44.22,44.46],[44.46,44.88],[44.88,45.18],[45.18,45.54],[45.54,45.98],[45.98,46.36],[46.36,46.86],[47.16,47.36],[47.36,47.6],[47.6,47.86],[47.86,48.16],[48.16,48.56],[48.56,48.94],[48.94,49.26],[49.26,49.84],[50.56,50.78],[50.78,51.14],[51.14,51.5],[51.5,51.82],[51.82,52.38],[52.38,52.4],[52.4,52.56],[52.56,52.84],[52.84,53.08],[53.08,53.36],[53.36,53.72],[53.72,54.06],[54.06,54.48],[55.02,55.18],[55.18,55.56],[55.56,55.96],[55.96,56.5],[56.5,56.88],[56.88,57.32],[57.32,57.6],[57.6,57.88],[57.88,58.04],[58.04,58.46],[58.46,59.26],[59.26,59.58],[59.58,59.88],[59.88,60.06],[60.06,60.28],[60.28,60.52],[60.52,60.86],[60.86,61.2],[61.2,61.5],[61.5,61.98],[61.98,62.16],[62.16,62.48],[63.38,63.54],[63.54,63.84],[63.84,64.02],[64.02,64.36],[64.36,65.08],[65.32,65.86],[65.86,65.89],[65.89,66.2],[66.2,66.72],[66.72,67.48],[67.82,68.08],[68.08,68.26],[68.26,68.48],[68.48,68.8],[68.8,69.12],[69.12,69.48],[69.48,69.74],[69.74,70.02],[70.34,70.5],[70.5,70.7],[70.7,71.14],[71.14,71.54],[71.54,71.78],[71.78,72],[72,72.34],[72.34,72.74],[72.74,73.18],[73.18,73.62],[73.62,73.82],[73.82,74.12],[74.12,74.38],[75.02,75.24],[75.24,75.5],[75.5,75.84],[75.84,76.22],[76.22,76.4],[76.4,76.54],[76.54,76.8],[76.8,77],[77,77.32],[77.98,78.28],[78.28,78.72],[78.72,79.42],[79.42,79.8],[79.8,80.12],[80.12,80.66],[81.08,81.2],[81.2,81.42],[81.42,81.78],[81.78,82.1],[82.1,82.56],[82.56,83.14],[83.14,83.76],[83.76,84.14],[84.14,84.52],[84.52,84.86],[84.86,85.28],[85.28,85.31],[85.31,85.5],[85.5,86.18],null,[86.78,87.08],[87.08,87.38],[87.38,87.58],[87.58,87.8],[87.8,87.96],[87.96,88.12],[88.12,88.4],[88.4,88.7],[88.7,89.02],[89.02,89.22],[89.22,89.52],[89.52,90.26],[91.04,91.2],[91.2,91.48],[91.48,91.92],[91.92,92.24],[92.24,92.46],[92.46,93.22],[93.52,93.76],[93.76,94.38],[94.38,94.74],[94.74,95.06],[95.06,95.32],[95.32,95.48],[95.48,95.96],[95.96,96.38],[97.04,97.22],[97.22,97.84],[97.84,97.88],[97.88,98.16],[98.16,98.62],[98.62,98.9],[98.9,99.58],[99.96,100.22],[100.22,100.5],[100.5,100.66],[100.66,100.84],[100.84,101.08],[101.08,101.24],[101.24,101.66],[101.66,102],[102,102.28],[102.28,102.6],[102.6,102.94],[102.94,103.32],[103.32,103.86],[103.86,103.9],[103.9,104.04],[104.04,104.38]]
        },
        "title": "第四列",
        "theme": {
          "zh": "傀儡觉醒",
          "en": "A Puppet Successor Yearns for Truth"
        },
        "words": [
          {
            "id": "s5col4-resent",
            "word": "resent",
            "pos": "v.",
            "meaning": "怨恨；愤恨"
          },
          {
            "id": "s5col4-assortment",
            "word": "assortment",
            "pos": "n.",
            "meaning": "各式各样；分类"
          },
          {
            "id": "s5col4-absurd",
            "word": "absurd",
            "pos": "adj.",
            "meaning": "荒谬的；荒唐的"
          },
          {
            "id": "s5col4-module",
            "word": "module",
            "pos": "n.",
            "meaning": "模块；组件"
          },
          {
            "id": "s5col4-malignant",
            "word": "malignant",
            "pos": "adj.",
            "meaning": "恶性的；恶意的"
          },
          {
            "id": "s5col4-interweave",
            "word": "interweave",
            "pos": "v.",
            "meaning": "交织；交错编织"
          },
          {
            "id": "s5col4-premise",
            "word": "premise",
            "pos": "n.",
            "meaning": "前提"
          },
          {
            "id": "s5col4-circuit",
            "word": "circuit",
            "pos": "n.",
            "meaning": "巡回路线；电路"
          },
          {
            "id": "s5col4-abolition",
            "word": "abolition",
            "pos": "n.",
            "meaning": "废除；废止"
          },
          {
            "id": "s5col4-synonymous",
            "word": "synonymous",
            "pos": "adj.",
            "meaning": "同义的；等同于…的"
          },
          {
            "id": "s5col4-yearn",
            "word": "yearn",
            "pos": "v.",
            "meaning": "渴望；向往"
          },
          {
            "id": "s5col4-connotation",
            "word": "connotation",
            "pos": "n.",
            "meaning": "内涵；言外之意"
          },
          {
            "id": "s5col4-vista",
            "word": "vista",
            "pos": "n.",
            "meaning": "景色；远景"
          },
          {
            "id": "s5col4-viciously",
            "word": "viciously",
            "pos": "adv.",
            "meaning": "残酷地；恶毒地"
          },
          {
            "id": "s5col4-immersion",
            "word": "immersion",
            "pos": "n.",
            "meaning": "沉浸；专心投入"
          },
          {
            "id": "s5col4-assimilate",
            "word": "assimilate",
            "pos": "v.",
            "meaning": "吸收；同化"
          },
          {
            "id": "s5col4-muddy",
            "word": "muddy",
            "pos": "adj.",
            "meaning": "浑浊的；泥泞的"
          },
          {
            "id": "s5col4-polarise",
            "word": "polarise",
            "pos": "v.",
            "meaning": "使两极分化"
          },
          {
            "id": "s5col4-offshore",
            "word": "offshore",
            "pos": "adj.",
            "meaning": "海外的；近海的"
          },
          {
            "id": "s5col4-contention",
            "word": "contention",
            "pos": "n.",
            "meaning": "论点；争论"
          },
          {
            "id": "s5col4-superstitious",
            "word": "superstitious",
            "pos": "adj.",
            "meaning": "迷信的"
          },
          {
            "id": "s5col4-facet",
            "word": "facet",
            "pos": "n.",
            "meaning": "方面；层面"
          },
          {
            "id": "s5col4-reign",
            "word": "reign",
            "pos": "v.",
            "meaning": "统治；盛行"
          },
          {
            "id": "s5col4-constitution",
            "word": "constitution",
            "pos": "n.",
            "meaning": "宪法；章程"
          },
          {
            "id": "s5col4-ubiquitous",
            "word": "ubiquitous",
            "pos": "adj.",
            "meaning": "无处不在的；普遍存在的"
          },
          {
            "id": "s5col4-brutal",
            "word": "brutal",
            "pos": "adj.",
            "meaning": "残酷的；野蛮的"
          },
          {
            "id": "s5col4-synthetic",
            "word": "synthetic",
            "pos": "adj.",
            "meaning": "合成的；人造的"
          },
          {
            "id": "s5col4-stifle",
            "word": "stifle",
            "pos": "v.",
            "meaning": "压制；扼杀"
          },
          {
            "id": "s5col4-inventory",
            "word": "inventory",
            "pos": "n.",
            "meaning": "清单；详细目录"
          },
          {
            "id": "s5col4-spontaneously",
            "word": "spontaneously",
            "pos": "adv.",
            "meaning": "自发地"
          },
          {
            "id": "s5col4-puppet",
            "word": "puppet",
            "pos": "n.",
            "meaning": "傀儡"
          },
          {
            "id": "s5col4-successor",
            "word": "successor",
            "pos": "n.",
            "meaning": "继任者；接班人"
          },
          {
            "id": "s5col4-intuition",
            "word": "intuition",
            "pos": "n.",
            "meaning": "直觉"
          },
          {
            "id": "s5col4-attributable",
            "word": "attributable",
            "pos": "adj.",
            "meaning": "可归因于…的"
          }
        ],
        "paragraphs": [
          {
            "id": "s5col4-p1",
            "segments": [
              "In a ",
              {
                "vocabId": "s5col4-brutal",
                "text": "brutal"
              },
              " kingdom where fear and ",
              {
                "vocabId": "s5col4-superstitious",
                "text": "superstitious"
              },
              " ritual ",
              {
                "vocabId": "s5col4-reign",
                "text": "reign"
              },
              " supreme, the old tyrant lies dying. His chosen ",
              {
                "vocabId": "s5col4-successor",
                "text": "successor"
              },
              ", Prince Aldric, is widely regarded as a mere ",
              {
                "vocabId": "s5col4-puppet",
                "text": "puppet"
              },
              ", a figurehead installed to preserve the ",
              {
                "vocabId": "s5col4-malignant",
                "text": "malignant"
              },
              " order that has ",
              {
                "vocabId": "s5col4-viciously",
                "text": "viciously"
              },
              " crushed dissent for decades. Yet beneath his compliant exterior, Aldric harbors a secret resolve: he has come to ",
              {
                "vocabId": "s5col4-resent",
                "text": "resent"
              },
              " the cruelty done in his name and cannot help but ",
              {
                "vocabId": "s5col4-yearn",
                "text": "yearn"
              },
              " to ",
              {
                "vocabId": "s5col4-assimilate",
                "text": "assimilate"
              },
              " the truth the regime has buried beneath layers of ",
              {
                "vocabId": "s5col4-synthetic",
                "text": "synthetic"
              },
              " propaganda."
            ],
            "analysis": {
              "translation": "在一个恐惧与迷信仪式横行的残暴王国里，年迈的暴君奄奄一息。他所选定的继任者奥德里克王子被普遍视为一个傀儡，一个被安插进来以维系那个数十年来残酷镇压异见的恶性秩序的挂名人物。然而在他顺从的外表之下，奥德里克怀着一个秘密的决心：他已开始痛恨以自己名义犯下的暴行，不禁渴望去吸纳这个政权埋藏在层层虚假宣传之下的真相。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在一个恐惧与迷信仪式横行的残暴王国里，年迈的暴君奄…” → “他所选定的继任者奥德里克王子被普遍视为一个傀儡，一…” → “在他顺从的外表之下，奥德里克怀着一个秘密的决心：他…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">the old tyrant lies dying</span>，<span class=\"keyword\">In a brutal kingdom where fear and superstitious ritual reign supreme</span> 为地点状语，其中 where 引导定语从句修饰 kingdom。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">lies dying</span> 中 dying 为现在分词作表语/状语，表示“奄奄一息”的状态。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">Prince Aldric, is widely regarded as a mere puppet</span>，使用被动语态 be regarded as（被视为），a figurehead 为 puppet 的同位语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">installed to preserve the malignant order</span> 为过去分词短语作后置定语修饰 figurehead，<span class=\"keyword\">that has viciously crushed dissent for decades</span> 为定语从句修饰 order。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Aldric harbors a secret resolve</span>，<span class=\"keyword\">beneath his compliant exterior</span> 为介词短语作地点状语。",
                "<span class=\"keyword\">逻辑衔接</span>：冒号后为 resolve 的同位说明，<span class=\"keyword\">he has come to resent the cruelty</span> 中 has come to do 表示“逐渐开始”，<span class=\"keyword\">done in his name</span> 为过去分词短语作后置定语修饰 cruelty。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">cannot help but yearn to assimilate the truth</span> 中 cannot help but do（不禁要做），yearn to do（渴望做），<span class=\"keyword\">the regime has buried beneath layers of synthetic propaganda</span> 为省略 that 的定语从句修饰 truth。",
                "<span class=\"keyword\">语境搭配</span>：brutal 出现在“In a brutal kingdom where fear”中，本段取“残酷的”义；superstitious 出现在“fear and superstitious ritual reign supreme”中，本段取“迷信的”义；reign 出现在“superstitious ritual reign supreme”中，本段取“统治”义；successor 出现在“His chosen successor”中，本段取“继任者”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col4-p2",
            "segments": [
              "The kingdom runs on an ",
              {
                "vocabId": "s5col4-assortment",
                "text": "assortment"
              },
              " of manufactured doctrines, each a ",
              {
                "vocabId": "s5col4-module",
                "text": "module"
              },
              " of control designed to ",
              {
                "vocabId": "s5col4-interweave",
                "text": "interweave"
              },
              " loyalty with terror. The ",
              {
                "vocabId": "s5col4-premise",
                "text": "premise"
              },
              " is simple but ",
              {
                "vocabId": "s5col4-absurd",
                "text": "absurd"
              },
              ": that the ruler's bloodline is ",
              {
                "vocabId": "s5col4-synonymous",
                "text": "synonymous"
              },
              " with divine favor, and any doubt is ",
              {
                "vocabId": "s5col4-attributable",
                "text": "attributable"
              },
              " to demonic influence. This ",
              {
                "vocabId": "s5col4-contention",
                "text": "contention"
              },
              " is reinforced through a ",
              {
                "vocabId": "s5col4-circuit",
                "text": "circuit"
              },
              " of priests who patrol every village, ensuring that ",
              {
                "vocabId": "s5col4-ubiquitous",
                "text": "ubiquitous"
              },
              " shrines dominate each ",
              {
                "vocabId": "s5col4-vista",
                "text": "vista"
              },
              " of the landscape. To question them is to risk the ",
              {
                "vocabId": "s5col4-abolition",
                "text": "abolition"
              },
              " of one's family name."
            ],
            "analysis": {
              "translation": "这个王国靠一套拼凑而成的捏造学说运转，每一条都是旨在将忠诚与恐惧交织在一起的控制模块。其前提简单却荒谬：统治者的血统等同于神灵的恩宠，任何怀疑都可归因于恶魔的影响。这一论断通过一个巡回祭司网络得到强化，他们巡查每个村庄，确保无处不在的神龛主导着每一处风景。质疑他们就等于冒着家族姓氏被废除的风险。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这个王国靠一套拼凑而成的捏造学说运转，每一条都是旨…” → “这一论断通过一个巡回祭司网络得到强化，他们巡查每个…” → “质疑他们就等于冒着家族姓氏被废除的风险” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The kingdom runs on an assortment of manufactured doctrines</span>，run on（靠……运转），an assortment of（一套、各种）。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">each a module of control designed to interweave loyalty with terror</span> 为独立主格结构，each 指代 doctrine，designed to...为过去分词作后置定语，interweave...with...（把……与……交织）。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The premise is simple but absurd</span>，冒号后 that 引导同位语从句解释 premise 的内容。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">is synonymous with</span>（与……同义）为固定搭配，<span class=\"keyword\">is attributable to</span>（可归因于）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">This contention is reinforced through a circuit of priests</span>，使用被动语态，<span class=\"keyword\">who patrol every village</span> 为定语从句修饰 priests。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">ensuring that ubiquitous shrines dominate each vista of the landscape</span> 为现在分词短语作伴随状语，ensuring 后接 that 引导的宾语从句。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：第四句 <span class=\"keyword\">To question them is to risk the abolition of one's family name</span> 中，To question them 为动词不定式作主语，to risk...作表语，is to...（做……就是做……）结构。",
                "<span class=\"keyword\">语境搭配</span>：assortment 出现在“on an assortment of manufactured doctrines”中，本段取“各式各样”义；module 出现在“each a module of control designed”中，本段取“模块”义；interweave 出现在“designed to interweave loyalty with terror”中，本段取“交织”义；premise 出现在“The premise is simple but”中，本段取“前提”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col4-p3",
            "segments": [
              "Aldric knows the word \"reform\" carries a dangerous ",
              {
                "vocabId": "s5col4-connotation",
                "text": "connotation"
              },
              " here. Any hint of change would ",
              {
                "vocabId": "s5col4-polarise",
                "text": "polarise"
              },
              " the court, and his advisors urge him to ",
              {
                "vocabId": "s5col4-stifle",
                "text": "stifle"
              },
              " such impulses before they take root. Yet his ",
              {
                "vocabId": "s5col4-intuition",
                "text": "intuition"
              },
              " tells him the people are ready. Whispers gather ",
              {
                "vocabId": "s5col4-spontaneously",
                "text": "spontaneously"
              },
              " in the marketplaces, and letters arrive from ",
              {
                "vocabId": "s5col4-offshore",
                "text": "offshore"
              },
              " exiles describing freer lands governed by a written ",
              {
                "vocabId": "s5col4-constitution",
                "text": "constitution"
              },
              ". He must not let the river of truth grow ",
              {
                "vocabId": "s5col4-muddy",
                "text": "muddy"
              },
              " with half-measures."
            ],
            "analysis": {
              "translation": "奥德里克知道“改革”一词在这里带有危险的内涵。任何变革的苗头都会使朝廷两极分化，他的顾问们敦促他在这种念头扎根之前就将其扼杀。然而他的直觉告诉他，人民已经准备好了。窃窃私语在集市中自发聚集，来自海外流亡者的信件描述着由成文宪法治理的更自由的土地。他绝不能让真理之河因半吊子措施而变得浑浊。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “奥德里克知道改革一词在这里带有危险的内涵” → “他的直觉告诉他，人民已经准备好了” → “他绝不能让真理之河因半吊子措施而变得浑浊” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Aldric knows the word carries a dangerous connotation here</span>，knows 后接省略 that 的宾语从句，connotation 意为“内涵、暗示”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">Any hint of change would polarise the court</span>，<span class=\"keyword\">and his advisors urge him to stifle such impulses</span> 为并列分句，urge sb. to do sth.（敦促某人做某事）。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">before they take root</span> 为时间状语从句，take root（扎根）为固定搭配。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">his intuition tells him the people are ready</span>，tells 后接双宾语，the people are ready 为省略 that 的宾语从句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">Whispers gather spontaneously in the marketplaces</span> 中 gather 意为“聚集”，<span class=\"keyword\">describing freer lands governed by a written constitution</span> 为现在分词短语作后置定语修饰 letters，governed by 为过去分词作后置定语修饰 lands。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：末句 <span class=\"keyword\">He must not let the river of truth grow muddy with half-measures</span> 中 let sb./sth. do sth.（让……做……），grow muddy 为不带 to 的不定式作宾补，river of truth 为比喻。",
                "<span class=\"keyword\">语境搭配</span>：connotation 出现在“a dangerous connotation here”中，本段取“内涵”义；polarise 出现在“change would polarise the court”中，本段取“使两极分化”义；stifle 出现在“him to stifle such impulses before”中，本段取“压制”义；intuition 出现在“Yet his intuition tells him the”中，本段取“直觉”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s5col4-p4",
            "segments": [
              "Through deep ",
              {
                "vocabId": "s5col4-immersion",
                "text": "immersion"
              },
              " in forbidden archives, Aldric catalogues every ",
              {
                "vocabId": "s5col4-facet",
                "text": "facet"
              },
              " of the regime's crimes. He compiles a careful ",
              {
                "vocabId": "s5col4-inventory",
                "text": "inventory"
              },
              " of injustices, preparing for the day he can dismantle the machinery of oppression and forge a just future."
            ],
            "analysis": {
              "translation": "通过深入研读被禁的档案，奥德里克为政权罪行的每一个方面都编了目。他编制了一份详尽的不公正清单，为有朝一日能够拆解压迫机器、锻造一个公正的未来做准备。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “通过深入研读被禁的档案，奥德里克为政权罪行的每一个…” → “他编制了一份详尽的不公正清单，为有朝一日能够拆解压…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">Through deep immersion in forbidden archives</span> 为介词短语作方式状语，immersion in（沉浸于、深入研读）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Aldric catalogues every facet of the regime's crimes</span>，catalogue 此处作动词意为“编目、逐一记录”，facet 意为“方面”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">He compiles a careful inventory of injustices</span>，compile an inventory（编制清单）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">preparing for the day he can dismantle the machinery of oppression and forge a just future</span> 为现在分词短语作伴随状语，表目的。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">he can dismantle the machinery of oppression and forge a just future</span> 为省略 when/that 的定语从句修饰 day，dismantle（拆解）与 forge（锻造）为并列谓语动词。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：immersion 出现在“Through deep immersion in forbidden archives”中，本段取“沉浸”义；facet 出现在“catalogues every facet of the regime's”中，本段取“方面”义；inventory 出现在“a careful inventory of injustices”中，本段取“清单”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "set6",
    "number": 6,
    "label": "第六份",
    "columns": [
      {
        "id": "s6col1",
        "number": 1,
        "audio": {
          "src": "audio/list6_col1.mp3",
          "cues": [[2.08,2.24],[2.24,2.7],[2.98,3.18],[3.18,3.5],[3.5,3.72],[3.72,3.88],[3.88,4.14],[4.14,4.4],[4.4,5],[5,5.22],[5.22,5.48],[5.48,5.76],[5.76,6.06],[6.06,6.28],[6.28,6.56],[6.56,6.78],[6.78,7.3],[7.9,7.92],[7.92,8.2],[8.2,8.58],[8.58,8.82],[8.82,9.08],[9.08,9.52],[9.52,9.84],[9.84,10.24],[10.24,10.72],[10.72,11.08],[11.08,11.26],[11.26,11.44],[11.44,11.76],[11.76,12.12],[12.12,12.22],[12.22,12.5],[12.5,13.46],[13.46,13.5],[13.5,13.86],[13.86,14.2],[14.2,14.48],[14.48,14.98],[14.98,15.42],[15.42,15.66],[15.66,15.98],[16.62,16.78],[16.78,16.98],[16.98,17.18],[17.18,17.66],[17.66,18.56],[18.56,18.58],[18.58,18.6],[18.6,19.16],[19.16,19.7],[20.08,20.26],[20.26,20.74],[20.74,21.2],[21.2,21.42],[21.42,21.88],[21.88,22.28],[22.28,22.6],[22.6,22.94],[22.94,23.42],[23.42,23.94],[23.94,24.2],[24.2,24.42],[24.42,24.76],[25.42,25.56],[25.56,26.02],[26.02,26.78],[26.78,27.48],[27.48,27.7],[27.7,27.86],[27.86,28.16],[28.16,28.68],[28.68,28.98],[28.98,29.24],[29.24,29.88],[30.32,30.54],[30.54,30.96],[30.96,30.98],[30.98,31.12],[31.12,31.34],[31.34,31.64],[31.64,32.26],[32.26,32.72],[32.72,33.02],[33.02,33.34],[33.34,33.94],[33.94,34.4],[34.4,34.64],[34.64,34.96],[34.96,35.5],[36.4,36.58],[36.58,37.02],[37.02,37.04],[37.04,37.08],[37.08,37.32],[37.32,37.6],[37.6,37.96],[37.96,38.26],[38.26,38.6],[38.6,38.8],[38.8,39.18],[39.18,39.54],[39.54,39.88],[39.88,40.14],[40.14,40.42],[40.42,40.72],[40.72,41.18],[41.68,41.84],[41.84,42.06],[42.06,42.28],[42.28,42.52],[42.52,42.78],[42.78,43],[43,43.58],[43.58,43.59],[43.59,43.68],[43.68,44.32],[44.32,44.64],[44.64,45.02],[45.02,45.52],[45.52,45.84],[45.84,46.06],[46.06,46.22],[46.22,46.86],[46.86,47.2],[47.2,47.8],[47.8,48.4],[48.4,48.88],[48.88,49.24],[49.24,49.38],[49.38,49.72],[50.42,50.66],[50.66,51.02],[51.02,51.34],[51.34,51.68],[51.68,51.9],[51.9,52.26],[52.26,52.56],[52.56,52.88],[52.88,53.26],[53.26,53.66],[54.2,54.66],[54.66,55.12],[55.12,55.32],[55.32,55.56],[55.56,55.88],[55.88,56.22],[56.22,56.52],[56.52,56.72],[56.72,56.98],[56.98,57.42],[57.42,57.8],[57.8,57.86],[57.86,58.26],[58.26,58.48],[58.48,58.86],[58.86,59.46],[59.96,60.16],[60.16,60.62],[60.62,61.02],[61.02,61.22],[61.22,61.3],[61.3,61.5],[61.5,61.76],[61.94,62.04],[62.04,62.32],[62.32,62.66],[62.66,62.88],[62.88,62.98],[62.98,63.18],[63.18,63.66],[63.66,63.92],[63.92,64.2],[64.2,64.4],[64.4,64.62],[64.62,64.98],[64.98,65.18],[65.18,65.44],[65.44,65.76],[65.76,66.38],[66.74,66.86],[66.86,67.46],[67.46,67.9],[67.9,68.34],[68.34,68.84],null,[69.48,69.96],[69.96,69.99],[69.99,70.32],[70.32,70.74],[70.74,71.06],[71.36,71.6],[71.6,71.86],[71.86,72.2],[72.2,72.52],[72.52,72.8],[72.8,73.12],[73.82,73.96],[73.96,74.2],[74.2,74.5],[74.5,74.68],[74.68,75],[75,75.36],[75.36,75.56],[75.56,75.88],[75.88,76.6],[76.6,76.86],[76.86,77.08],[77.08,77.42],[77.42,77.92],[77.92,78.16],[78.16,78.56],[78.56,79.12],[79.12,79.38],[79.38,79.54],[79.54,79.92],[80.36,80.6],[80.6,81.02],null,[81.02,81.34],[81.34,81.8],[81.9,82.32],[82.32,82.66],[82.66,83.08],[83.08,83.54],[83.54,84.34],[84.34,84.68],[84.68,85.02],[85.02,85.36],[85.36,85.58],[85.58,85.92],[85.92,86.16],[86.16,86.3],[86.3,86.46],[86.46,86.86],[86.86,86.89],[86.89,87.2],[87.2,87.66],[87.66,87.96],[87.96,88.22],[88.22,88.76],[89.46,89.7],[89.7,90],[90.46,90.64],[90.64,90.94],[90.94,91.28],[91.28,91.66],[91.66,92.02],[92.02,92.4],[93.14,93.28],[93.28,93.5],[93.5,93.82],[93.82,94.06],[94.06,94.26],[94.26,94.6],[94.6,94.78],[94.78,94.94],[94.94,95.14],[95.14,95.5],[95.5,95.92],[95.92,96.46],[96.46,97.02],[97.02,97.26],[97.26,97.32],[97.32,97.9],[97.9,98.14],[98.14,98.52],[98.52,98.96],[98.96,99.16],[99.16,99.38],[99.38,99.7],[99.7,100.38],[100.38,100.66],[100.66,100.94],[100.94,101.36],[102.14,102.24],[102.24,102.52],[102.52,102.72],[102.72,103],[103,103.16],[103.16,103.36],[103.36,103.74],[103.74,104.14],[104.14,104.56],[104.56,104.9],[104.9,105.28],[105.28,105.84],[105.84,106.22],[106.22,106.6],[106.6,107.02],[107.02,107.42],[107.42,107.88],[107.88,108.2],[108.2,108.5],[108.5,108.82],[108.82,109.22],[109.22,109.54]]
        },
        "title": "第一列",
        "theme": {
          "zh": "医学调查",
          "en": "Medical Investigation"
        },
        "words": [
          {
            "id": "s6col1-articulate",
            "word": "articulate",
            "pos": "v.",
            "meaning": "清晰表达"
          },
          {
            "id": "s6col1-sip",
            "word": "sip",
            "pos": "v.",
            "meaning": "啜饮"
          },
          {
            "id": "s6col1-enlist",
            "word": "enlist",
            "pos": "v.",
            "meaning": "征募；谋取（帮助）"
          },
          {
            "id": "s6col1-savage",
            "word": "savage",
            "pos": "adj.",
            "meaning": "凶猛的；野蛮的"
          },
          {
            "id": "s6col1-mourn",
            "word": "mourn",
            "pos": "v.",
            "meaning": "哀悼"
          },
          {
            "id": "s6col1-sprawl",
            "word": "sprawl",
            "pos": "v.",
            "meaning": "蔓延；伸开手足躺"
          },
          {
            "id": "s6col1-textile",
            "word": "textile",
            "pos": "n.",
            "meaning": "纺织品"
          },
          {
            "id": "s6col1-storey",
            "word": "storey",
            "pos": "n.",
            "meaning": "楼层"
          },
          {
            "id": "s6col1-detrimental",
            "word": "detrimental",
            "pos": "adj.",
            "meaning": "有害的"
          },
          {
            "id": "s6col1-conscience",
            "word": "conscience",
            "pos": "n.",
            "meaning": "良心"
          },
          {
            "id": "s6col1-havoc",
            "word": "havoc",
            "pos": "n.",
            "meaning": "大破坏"
          },
          {
            "id": "s6col1-gigantic",
            "word": "gigantic",
            "pos": "adj.",
            "meaning": "巨大的"
          },
          {
            "id": "s6col1-aftermath",
            "word": "aftermath",
            "pos": "n.",
            "meaning": "后果；灾后"
          },
          {
            "id": "s6col1-confession",
            "word": "confession",
            "pos": "n.",
            "meaning": "供认；忏悔"
          },
          {
            "id": "s6col1-slender",
            "word": "slender",
            "pos": "adj.",
            "meaning": "细长的；微薄的"
          },
          {
            "id": "s6col1-gaze",
            "word": "gaze",
            "pos": "v./n.",
            "meaning": "凝视"
          },
          {
            "id": "s6col1-overdue",
            "word": "overdue",
            "pos": "adj.",
            "meaning": "过期的；迟到的"
          },
          {
            "id": "s6col1-fertile",
            "word": "fertile",
            "pos": "adj.",
            "meaning": "肥沃的；多产的"
          },
          {
            "id": "s6col1-defective",
            "word": "defective",
            "pos": "adj.",
            "meaning": "有缺陷的"
          },
          {
            "id": "s6col1-auditory",
            "word": "auditory",
            "pos": "adj.",
            "meaning": "听觉的"
          },
          {
            "id": "s6col1-breach",
            "word": "breach",
            "pos": "n.",
            "meaning": "违反；缺口"
          },
          {
            "id": "s6col1-rust",
            "word": "rust",
            "pos": "n./v.",
            "meaning": "锈；生锈"
          },
          {
            "id": "s6col1-expend",
            "word": "expend",
            "pos": "v.",
            "meaning": "花费；消耗"
          },
          {
            "id": "s6col1-malfunction",
            "word": "malfunction",
            "pos": "n./v.",
            "meaning": "故障"
          },
          {
            "id": "s6col1-refinement",
            "word": "refinement",
            "pos": "n.",
            "meaning": "精炼；改进"
          },
          {
            "id": "s6col1-hypocritical",
            "word": "hypocritical",
            "pos": "adj.",
            "meaning": "伪善的"
          },
          {
            "id": "s6col1-vicinity",
            "word": "vicinity",
            "pos": "n.",
            "meaning": "附近"
          },
          {
            "id": "s6col1-genre",
            "word": "genre",
            "pos": "n.",
            "meaning": "类型；流派"
          },
          {
            "id": "s6col1-crunchy",
            "word": "crunchy",
            "pos": "adj.",
            "meaning": "松脆的"
          },
          {
            "id": "s6col1-perpetual",
            "word": "perpetual",
            "pos": "adj.",
            "meaning": "永久的"
          },
          {
            "id": "s6col1-inspector",
            "word": "inspector",
            "pos": "n.",
            "meaning": "检查员"
          },
          {
            "id": "s6col1-concede",
            "word": "concede",
            "pos": "v.",
            "meaning": "承认；让步"
          },
          {
            "id": "s6col1-suffice",
            "word": "suffice",
            "pos": "v.",
            "meaning": "足够"
          }
        ],
        "paragraphs": [
          {
            "id": "s6col1-p1",
            "segments": [
              "When Inspector Morrison arrived at the five-",
              {
                "vocabId": "s6col1-storey",
                "text": "storey"
              },
              " hospital, she could already sense that something was wrong. The building seemed to ",
              {
                "vocabId": "s6col1-sprawl",
                "text": "sprawl"
              },
              " across the entire block, and in the ",
              {
                "vocabId": "s6col1-vicinity",
                "text": "vicinity"
              },
              " of the east wing, a ",
              {
                "vocabId": "s6col1-perpetual",
                "text": "perpetual"
              },
              " hum of anxiety filled the air. She had come to investigate a ",
              {
                "vocabId": "s6col1-defective",
                "text": "defective"
              },
              "\n",
              {
                "vocabId": "s6col1-auditory",
                "text": "auditory"
              },
              " implant, whose ",
              {
                "vocabId": "s6col1-malfunction",
                "text": "malfunction"
              },
              " had harmed three patients and caused ",
              {
                "vocabId": "s6col1-detrimental",
                "text": "detrimental"
              },
              " effects to their hearing. The ",
              {
                "vocabId": "s6col1-gigantic",
                "text": "gigantic"
              },
              " manufacturer, known for its ",
              {
                "vocabId": "s6col1-fertile",
                "text": "fertile"
              },
              " innovations in medical devices, now faced a ",
              {
                "vocabId": "s6col1-breach",
                "text": "breach"
              },
              " of safety regulations that no polite explanation could ",
              {
                "vocabId": "s6col1-suffice",
                "text": "suffice"
              },
              " to explain."
            ],
            "analysis": {
              "translation": "当莫里森督察到达那座五层的医院时，她已经能感觉到有些不对劲。这座建筑似乎蔓延了整整一个街区，在东翼附近，空气中弥漫着一种挥之不去的焦虑嗡鸣。她来调查一个有缺陷的听觉植入物，其故障已经伤害了三名患者，并对他们的听力造成了有害影响。这家以医疗器械方面的丰富创新而闻名的巨头制造商，如今面临着安全规定的违规，任何客气的解释都无法将其搪塞过去。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当莫里森督察到达那座五层的医院时，她已经能感觉到有…” → “她来调查一个有缺陷的听觉植入物，其故障已经伤害了三…” → “这家以医疗器械方面的丰富创新而闻名的巨头制造商，如…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">When Inspector Morrison arrived at the five-storey hospital</span> 为时间状语从句，主句主干为 <span class=\"keyword\">she could already sense that something was wrong</span>，that 引导宾语从句。",
                "<span class=\"keyword\">地道表达</span>：第二句由 and 连接两个并列分句：<span class=\"keyword\">The building seemed to sprawl across the entire block</span> 和 <span class=\"keyword\">a perpetual hum of anxiety filled the air</span>，<span class=\"keyword\">in the vicinity of the east wing</span> 为地点状语，in the vicinity of（在……附近）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">She had come to investigate a defective auditory implant</span>，<span class=\"keyword\">to investigate</span> 为动词不定式作目的状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">whose malfunction had harmed three patients and caused detrimental effects to their hearing</span> 为定语从句修饰 implant，whose 作定语，had harmed 和 caused 为并列谓语（过去完成时）。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">the gigantic manufacturer faced a breach of safety regulations</span>，<span class=\"keyword\">known for its fertile innovations in medical devices</span> 为过去分词短语作后置定语修饰 manufacturer。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that no polite explanation could suffice to explain</span> 为定语从句修饰 breach，suffice to do sth.（足以做某事）为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：storey 出现在“storey hospital”中，本段取“楼层”义；sprawl 出现在“seemed to sprawl across the entire”中，本段取“蔓延”义；vicinity 出现在“in the vicinity of the east”中，本段取“附近”义；perpetual 出现在“a perpetual hum of anxiety”中，本段取“永久的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col1-p2",
            "segments": [
              "Morrison took a ",
              {
                "vocabId": "s6col1-sip",
                "text": "sip"
              },
              " of cold coffee and began to ",
              {
                "vocabId": "s6col1-articulate",
                "text": "articulate"
              },
              " her questions to the hospital staff. She had to ",
              {
                "vocabId": "s6col1-enlist",
                "text": "enlist"
              },
              " the help of a forensic engineer to determine whether ",
              {
                "vocabId": "s6col1-rust",
                "text": "rust"
              },
              " on the device's ",
              {
                "vocabId": "s6col1-slender",
                "text": "slender"
              },
              " components had contributed to the failure. The ",
              {
                "vocabId": "s6col1-aftermath",
                "text": "aftermath"
              },
              " of the incident had wreaked ",
              {
                "vocabId": "s6col1-havoc",
                "text": "havoc"
              },
              " on patients' lives; some could no longer enjoy even the simple pleasure of a ",
              {
                "vocabId": "s6col1-crunchy",
                "text": "crunchy"
              },
              " apple without pain. One elderly man sat in his bed, his ",
              {
                "vocabId": "s6col1-gaze",
                "text": "gaze"
              },
              " fixed on the window, too weary to ",
              {
                "vocabId": "s6col1-mourn",
                "text": "mourn"
              },
              " the silence that now surrounded him."
            ],
            "analysis": {
              "translation": "莫里森抿了一口冷咖啡，开始向医院工作人员阐述她的疑问。她不得不寻求一位法医工程师的帮助，以确定设备纤细部件上的锈蚀是否导致了故障。事件的后果对患者的生活造成了严重破坏；有些人甚至再也无法享受吃一个脆苹果这样简单的快乐而不感到疼痛。一位老人坐在床上，目光凝视着窗户，太疲惫而不愿为如今笼罩他的寂静哀伤。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “莫里森抿了一口冷咖啡，开始向医院工作人员阐述她的疑…” → “事件的后果对患者的生活造成了严重破坏” → “一位老人坐在床上，目光凝视着窗户，太疲惫而不愿为如…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Morrison took a sip of cold coffee and began to articulate her questions</span>，take a sip of（抿一口）为固定搭配，began to articulate 为并列谓语。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">She had to enlist the help of a forensic engineer</span>，enlist the help of（寻求……的帮助）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">to determine whether rust on the device's slender components had contributed to the failure</span> 为动词不定式作目的状语，其中 whether 引导宾语从句作 determine 的宾语，contribute to（导致、促成）为固定搭配。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">The aftermath of the incident had wreaked havoc on patients' lives</span>，wreak havoc on（对……造成严重破坏）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">some could no longer enjoy even the simple pleasure of a crunchy apple without pain</span> 中 no longer（不再），without pain 为条件状语。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">One elderly man sat in his bed</span>，<span class=\"keyword\">his gaze fixed on the window</span> 为独立主格结构作伴随状语，<span class=\"keyword\">too weary to mourn the silence that now surrounded him</span> 为 too...to...（太……以至于不能……）结构，that 引导定语从句修饰 silence。",
                "<span class=\"keyword\">语境搭配</span>：sip 出现在“took a sip of cold coffee”中，本段取“啜饮”义；articulate 出现在“began to articulate her questions to”中，本段取“清晰表达”义；enlist 出现在“had to enlist the help of”中，本段取“征募”义；rust 出现在“determine whether rust on the device's”中，本段取“锈”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col1-p3",
            "segments": [
              "The company's representative was ",
              {
                "vocabId": "s6col1-hypocritical",
                "text": "hypocritical"
              },
              ", offering a ",
              {
                "vocabId": "s6col1-confession",
                "text": "confession"
              },
              " only after Morrison threatened to expose the scandal. He was forced to ",
              {
                "vocabId": "s6col1-concede",
                "text": "concede"
              },
              " that the ",
              {
                "vocabId": "s6col1-refinement",
                "text": "refinement"
              },
              " process had been rushed and that quality controls had been ignored. His ",
              {
                "vocabId": "s6col1-conscience",
                "text": "conscience"
              },
              ", it seemed, was ",
              {
                "vocabId": "s6col1-overdue",
                "text": "overdue"
              },
              " in surfacing. \"We cannot ",
              {
                "vocabId": "s6col1-expend",
                "text": "expend"
              },
              " any more lives for the sake of a profitable ",
              {
                "vocabId": "s6col1-genre",
                "text": "genre"
              },
              " of medical gadgets,\" Morrison declared, her voice ",
              {
                "vocabId": "s6col1-savage",
                "text": "savage"
              },
              " with controlled anger."
            ],
            "analysis": {
              "translation": "公司代表很虚伪，只是在莫里森威胁要曝光丑闻后才做出交代。他被迫承认精炼工艺被仓促进行，质量控制也被忽视了。他的良知似乎是迟迟才浮出水面。“我们不能为了一个有利可图的医疗器械品类而再耗费更多的生命，”莫里森宣称，她的声音因克制的愤怒而显得凌厉。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “公司代表很虚伪，只是在莫里森威胁要曝光丑闻后才做出…” → “他的良知似乎是迟迟才浮出水面” → “我们不能为了一个有利可图的医疗器械品类而再耗费更多…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The company's representative was hypocritical</span>，<span class=\"keyword\">offering a confession only after Morrison threatened to expose the scandal</span> 为现在分词短语作伴随状语，only after 引导时间状语从句。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">He was forced to concede that the refinement process had been rushed and that quality controls had been ignored</span>，使用被动语态 be forced to do（被迫做），concede 后接两个 that 引导的并列宾语从句。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">His conscience was overdue in surfacing</span>，it seemed 为插入语，overdue 意为“迟到的、过期的”，in surfacing 为介词短语。",
                "<span class=\"keyword\">地道表达</span>：末句为直接引语 <span class=\"keyword\">We cannot expend any more lives for the sake of a profitable genre of medical gadgets</span>，expend...for the sake of（为了……而耗费……）为固定搭配，genre 意为“类型”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">Morrison declared, her voice savage with controlled anger</span> 中 <span class=\"keyword\">her voice savage with controlled anger</span> 为独立主格结构作伴随状语，savage 为形容词作表语，with controlled anger 为原因状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：hypocritical 出现在“representative was hypocritical”中，本段取“伪善的”义；confession 出现在“offering a confession only after Morrison”中，本段取“供认”义；concede 出现在“forced to concede that the refinement”中，本段取“承认”义；refinement 出现在“that the refinement process had been”中，本段取“精炼”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col1-p4",
            "segments": [
              "She noted that the ",
              {
                "vocabId": "s6col1-textile",
                "text": "textile"
              },
              " used to wrap the devices was substandard and that the hospital's own ",
              {
                "vocabId": "s6col1-inspector",
                "text": "inspector"
              },
              " had failed to test the auditory modules thoroughly. It was clear that the company had valued profit over safety, and the investigation would continue until every detail was accounted for."
            ],
            "analysis": {
              "translation": "她指出，用来包裹设备的纺织材料是不合格的，而且医院自己的检验员也未能彻底测试听觉模块。很明显，公司把利润置于安全之上，调查将继续进行，直到每一个细节都被查清。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “她指出，用来包裹设备的纺织材料是不合格的，而且医院…” → “很明显，公司把利润置于安全之上，调查将继续进行，直…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">She noted that the textile...was substandard and that the hospital's own inspector had failed to test the auditory modules thoroughly</span>，noted 后接两个 that 引导的并列宾语从句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">used to wrap the devices</span> 为过去分词短语作后置定语修饰 textile，相当于定语从句 which was used to wrap the devices，textile 意为“纺织材料”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">fail to do sth.</span>（未能做某事）为固定搭配，thoroughly 为副词修饰 test，表示“彻底测试”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">It was clear that the company had valued profit over safety</span>，It 为形式主语，<span class=\"keyword\">that the company had valued profit over safety</span> 为主语从句，value A over B（把A看得比B重）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">the investigation would continue until every detail was accounted for</span> 为并列分句，<span class=\"keyword\">until every detail was accounted for</span> 为时间状语从句，account for（查清、说明）为固定搭配，使用被动语态。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">substandard</span>（不合格的）为由 standard 加前缀 sub-（低于）构成的形容词，表示“低于标准的”。",
                "<span class=\"keyword\">语境搭配</span>：textile 出现在“that the textile used to wrap”中，本段取“纺织品”义；inspector 出现在“hospital's own inspector had failed to”中，本段取“检查员”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s6col2",
        "number": 2,
        "audio": {
          "src": "audio/list6_col2.mp3",
          "cues": [[2.34,2.36],[2.36,2.9],[2.9,3.24],[3.24,3.6],[3.6,4.08],[4.08,4.12],[4.12,4.34],[4.34,4.64],[4.64,4.98],[4.98,5.22],[5.22,5.7],[5.7,6.42],[7.16,7.5],[7.5,8.06],[8.06,8.64],[8.64,9.18],[9.18,9.96],[10.1,10.36],[10.36,10.78],[10.78,11.08],[11.08,11.52],[11.52,11.9],[11.9,12.38],[13.12,13.26],[13.26,13.46],[13.46,13.6],[13.6,13.82],[13.82,13.9],[13.9,14.2],[14.2,14.7],[15.44,15.88],[15.88,15.92],[15.92,16.3],[16.3,16.76],[16.76,17.26],[18.02,18.16],[18.16,18.58],[18.58,18.92],[18.92,19.36],[19.36,20.36],null,[20.36,20.41],[20.41,20.68],[20.68,21.2],[21.6,21.78],[21.78,22.02],[22.02,22.38],[22.38,22.43],[22.43,22.86],[22.86,23.24],[23.24,23.58],[23.58,23.86],[23.86,24.84],[24.84,24.88],[24.88,25.28],[25.28,25.52],[25.52,25.74],[25.74,26.18],[26.18,26.52],[26.52,26.76],[26.76,27.06],[27.06,27.54],[27.54,28.02],[28.02,28.34],[28.34,28.98],[29.38,29.68],[29.68,30.52],[30.52,30.54],[30.54,30.66],[30.66,30.92],[30.92,31.24],[31.24,31.82],null,[32.34,32.6],[32.6,32.94],[32.94,33.2],[33.2,33.38],[33.38,33.72],[34.24,34.38],[34.38,34.66],[34.66,35.22],[35.22,35.86],[35.86,36.12],[36.12,36.38],[36.38,36.68],[36.68,37.16],[37.88,38.02],[38.02,38.2],[38.2,38.46],[38.46,38.9],[38.9,39.38],null,[40.2,40.39],[40.39,40.58],[41.24,41.38],[41.38,41.52],[41.52,41.78],[41.78,42.12],[42.12,42.62],[43.32,43.54],[43.54,43.78],[43.78,44.08],[44.08,44.32],[44.32,44.62],[44.62,44.82],[44.82,45.06],[45.06,45.32],[45.32,45.62],[45.62,45.84],[45.84,46],[46,46.42],[46.42,46.8],[46.8,47.46],null,[47.46,48.2],[48.2,48.46],[48.46,48.66],[48.66,49.06],[49.06,49.12],[49.12,49.44],[49.98,50.12],[50.12,50.3],[50.3,50.5],[50.5,50.74],[50.74,50.92],[50.92,51.3],null,[52.16,52.32],[52.32,52.48],[52.48,52.86],[52.86,53.38],[53.38,53.41],[53.41,53.62],[53.62,54.76],[54.76,54.79],[54.79,55.04],[55.04,55.46],[55.46,55.6],[55.6,55.9],[55.9,56.42],[56.42,57],[57,57.46],[57.46,57.68],[57.68,57.98],[57.98,58.38],[58.38,58.74],[59.4,59.5],[59.5,59.68],[59.68,59.9],[59.9,60.2],[60.2,60.5],[60.5,60.9],[60.9,61.12],[61.12,61.5],[61.9,62.16],[62.16,62.46],[62.46,62.76],[62.76,63.2],[63.2,63.46],[63.46,63.6],[63.6,63.86],[63.86,64.06],[64.06,64.42],[64.42,64.86],[64.86,65.16],[65.16,65.52],[66.3,66.5],[66.5,66.88],[67.24,67.52],[67.52,67.8],[67.8,68.12],[68.36,68.58],[68.58,68.96],[68.96,69.36],[69.36,69.72],[69.72,70.02],[70.02,70.07],[70.07,70.26],[70.26,70.62],[70.84,71.02],[71.02,71.26],[71.26,71.42],[71.42,71.76],[71.76,72.06],[72.06,72.34],[72.34,72.72],[72.72,73.12],[73.94,74.1],[74.1,74.26],[74.26,74.78],[74.78,75.2],[75.2,75.46],[75.46,75.76],[75.76,76],[76,76.74],[76.74,76.96],[76.96,77.44],[77.44,77.86],[77.86,78.14],[78.14,78.54],[78.54,78.86],[78.86,79.18],[79.18,79.24],[79.24,79.6],[79.6,79.98],[79.98,80.28],[80.28,80.52],[80.52,80.88],[80.88,81.24],[81.24,81.84],[82.32,82.36],[82.36,82.94],[82.94,82.96],[82.96,83.16],[83.16,83.46],[83.46,83.66],[83.66,84.06],[84.36,84.44],[84.44,84.74],[84.74,85],[85,85.4],[85.4,85.68],[85.68,85.94],[85.94,86.54],[87.32,87.42],[87.42,87.66],[87.66,87.88],[87.88,88.18],[88.18,89.18],[89.18,89.23],[89.23,89.46],[89.46,90.64],null,[90.64,90.68],[90.68,90.94],[90.94,91.54],[91.88,91.94],[91.94,92.12],[92.12,92.7],[92.7,92.91],[92.91,93.12],[93.8,94.06],[94.06,94.4],[94.52,94.58],[94.58,94.74],[94.74,95.18],[95.28,95.68],[95.68,96.1],[96.1,96.72],[97.5,97.58],[97.58,97.8],[97.8,97.98],[97.98,98.22],[98.22,98.52],[98.52,99.1],[99.1,99.14],[99.14,99.4],null,[100.14,100.34],[100.34,101.04],[101.54,101.72],[101.72,101.96],[101.96,102.12],[102.12,102.46],[102.46,102.94],[102.94,103.14],[103.14,103.34],[103.34,103.54],[103.54,103.84],[103.84,104.32],[104.32,104.5],[104.5,104.66],[104.66,104.9],[104.9,105.76],[105.76,105.96],[105.96,106.28],[106.28,106.64],[106.64,107.12],[107.12,107.3],[107.3,107.54],[107.54,108.04],[108.04,108.32],[108.32,108.5],[108.5,108.7],[108.7,109],[109,109.4],[109.4,109.8],[109.8,110.18]]
        },
        "title": "第二列",
        "theme": {
          "zh": "美术馆之谜",
          "en": "Mystery at the Art Gallery"
        },
        "words": [
          {
            "id": "s6col2-preferential",
            "word": "preferential",
            "pos": "adj.",
            "meaning": "优先的"
          },
          {
            "id": "s6col2-disastrous",
            "word": "disastrous",
            "pos": "adj.",
            "meaning": "灾难性的"
          },
          {
            "id": "s6col2-radiate",
            "word": "radiate",
            "pos": "v.",
            "meaning": "辐射；散发"
          },
          {
            "id": "s6col2-exclaim",
            "word": "exclaim",
            "pos": "v.",
            "meaning": "惊叫"
          },
          {
            "id": "s6col2-stupidity",
            "word": "stupidity",
            "pos": "n.",
            "meaning": "愚蠢"
          },
          {
            "id": "s6col2-proficient",
            "word": "proficient",
            "pos": "adj.",
            "meaning": "熟练的"
          },
          {
            "id": "s6col2-promptly",
            "word": "promptly",
            "pos": "adv.",
            "meaning": "迅速地"
          },
          {
            "id": "s6col2-unorthodox",
            "word": "unorthodox",
            "pos": "adj.",
            "meaning": "非正统的"
          },
          {
            "id": "s6col2-trophy",
            "word": "trophy",
            "pos": "n.",
            "meaning": "战利品；奖杯"
          },
          {
            "id": "s6col2-complexion",
            "word": "complexion",
            "pos": "n.",
            "meaning": "肤色；面容"
          },
          {
            "id": "s6col2-superficial",
            "word": "superficial",
            "pos": "adj.",
            "meaning": "表面的；肤浅的"
          },
          {
            "id": "s6col2-toss",
            "word": "toss",
            "pos": "v.",
            "meaning": "抛；掷"
          },
          {
            "id": "s6col2-accessory",
            "word": "accessory",
            "pos": "n.",
            "meaning": "附件；从犯"
          },
          {
            "id": "s6col2-precaution",
            "word": "precaution",
            "pos": "n.",
            "meaning": "预防措施"
          },
          {
            "id": "s6col2-slam",
            "word": "slam",
            "pos": "v.",
            "meaning": "砰地关上"
          },
          {
            "id": "s6col2-poised",
            "word": "poised",
            "pos": "adj.",
            "meaning": "泰然自若的；准备好的"
          },
          {
            "id": "s6col2-juvenile",
            "word": "juvenile",
            "pos": "adj.",
            "meaning": "青少年的"
          },
          {
            "id": "s6col2-fracture",
            "word": "fracture",
            "pos": "n./v.",
            "meaning": "骨折；断裂"
          },
          {
            "id": "s6col2-disposition",
            "word": "disposition",
            "pos": "n.",
            "meaning": "性情"
          },
          {
            "id": "s6col2-ponder",
            "word": "ponder",
            "pos": "v.",
            "meaning": "沉思"
          },
          {
            "id": "s6col2-benign",
            "word": "benign",
            "pos": "adj.",
            "meaning": "良性的；和蔼的"
          },
          {
            "id": "s6col2-profoundly",
            "word": "profoundly",
            "pos": "adv.",
            "meaning": "深刻地"
          },
          {
            "id": "s6col2-indifference",
            "word": "indifference",
            "pos": "n.",
            "meaning": "冷漠"
          },
          {
            "id": "s6col2-expel",
            "word": "expel",
            "pos": "v.",
            "meaning": "驱逐；开除"
          },
          {
            "id": "s6col2-emulate",
            "word": "emulate",
            "pos": "v.",
            "meaning": "仿效"
          },
          {
            "id": "s6col2-obedient",
            "word": "obedient",
            "pos": "adj.",
            "meaning": "顺从的"
          },
          {
            "id": "s6col2-anecdote",
            "word": "anecdote",
            "pos": "n.",
            "meaning": "轶事"
          },
          {
            "id": "s6col2-toddler",
            "word": "toddler",
            "pos": "n.",
            "meaning": "学步儿童"
          },
          {
            "id": "s6col2-inspect",
            "word": "inspect",
            "pos": "v.",
            "meaning": "检查"
          },
          {
            "id": "s6col2-discourse",
            "word": "discourse",
            "pos": "n.",
            "meaning": "论述；交谈"
          },
          {
            "id": "s6col2-commend",
            "word": "commend",
            "pos": "v.",
            "meaning": "表扬"
          },
          {
            "id": "s6col2-distortion",
            "word": "distortion",
            "pos": "n.",
            "meaning": "扭曲；变形"
          }
        ],
        "paragraphs": [
          {
            "id": "s6col2-p1",
            "segments": [
              "The Crestview Art Gallery was a place that seemed to ",
              {
                "vocabId": "s6col2-radiate",
                "text": "radiate"
              },
              " elegance. VIP guests received ",
              {
                "vocabId": "s6col2-preferential",
                "text": "preferential"
              },
              " treatment, sipping wine while admiring the exhibits. On the night of the annual exhibition, however, a ",
              {
                "vocabId": "s6col2-disastrous",
                "text": "disastrous"
              },
              " event unfolded. The gallery's most prized ",
              {
                "vocabId": "s6col2-trophy",
                "text": "trophy"
              },
              ", a golden sculpture, was found with a hairline ",
              {
                "vocabId": "s6col2-fracture",
                "text": "fracture"
              },
              " across its base, a ",
              {
                "vocabId": "s6col2-distortion",
                "text": "distortion"
              },
              " of its original form that no ",
              {
                "vocabId": "s6col2-superficial",
                "text": "superficial"
              },
              " repair could hide."
            ],
            "analysis": {
              "translation": "克雷斯特维尤美术馆是一个似乎散发着优雅气息的地方。贵宾们享受着优待，一边品着葡萄酒一边欣赏展品。然而，在年度展览的那个晚上，一场灾难性的事件发生了。美术馆最珍贵的奖杯——一座金色雕塑——被发现底座上有一道发丝般的裂缝，这是对其原初形态的一种扭曲，任何表面的修补都无法掩饰。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “克雷斯特维尤美术馆是一个似乎散发着优雅气息的地方” → “在年度展览的那个晚上，一场灾难性的事件发生了” → “美术馆最珍贵的奖杯——一座金色雕塑——被发现底座上…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The Crestview Art Gallery was a place</span>，<span class=\"keyword\">that seemed to radiate elegance</span> 为定语从句修饰 place，radiate elegance（散发优雅）。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">VIP guests received preferential treatment</span>，<span class=\"keyword\">sipping wine while admiring the exhibits</span> 为现在分词短语作伴随状语，while admiling 表同时发生的动作。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">a disastrous event unfolded</span>，<span class=\"keyword\">On the night of the annual exhibition, however</span> 为时间状语，however 表转折。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">The gallery's most prized trophy was found with a hairline fracture across its base</span>，使用被动语态，with a hairline fracture（带有一道发丝般的裂缝）作伴随状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">a distortion of its original form</span> 为 hairline fracture 的同位语，<span class=\"keyword\">that no superficial repair could hide</span> 为定语从句修饰 distortion。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：radiate 出现在“seemed to radiate elegance”中，本段取“辐射”义；preferential 出现在“guests received preferential treatment”中，本段取“优先的”义；disastrous 出现在“a disastrous event unfolded”中，本段取“灾难性的”义；trophy 出现在“most prized trophy”中，本段取“战利品”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col2-p2",
            "segments": [
              "Curator Lena, a woman of calm ",
              {
                "vocabId": "s6col2-disposition",
                "text": "disposition"
              },
              ", stood ",
              {
                "vocabId": "s6col2-poised",
                "text": "poised"
              },
              " at the entrance, her pale ",
              {
                "vocabId": "s6col2-complexion",
                "text": "complexion"
              },
              " betraying only the slightest alarm. She had taken every ",
              {
                "vocabId": "s6col2-precaution",
                "text": "precaution"
              },
              ": security cameras, guards, and locked display cases. Yet someone had managed to ",
              {
                "vocabId": "s6col2-toss",
                "text": "toss"
              },
              " the sculpture to the floor with startling ",
              {
                "vocabId": "s6col2-stupidity",
                "text": "stupidity"
              },
              ". \"Who would do such a thing?\" she could not help but ",
              {
                "vocabId": "s6col2-exclaim",
                "text": "exclaim"
              },
              "."
            ],
            "analysis": {
              "translation": "策展人莉娜是一位性情沉稳的女子，她镇定地站在入口处，苍白的面容只流露出最轻微的惊慌。她已经采取了一切预防措施：摄像头、警卫和上锁的展柜。然而还是有人竟然以令人吃惊的愚蠢把雕塑扔到了地上。“谁会做出这种事？”她不禁惊呼。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “策展人莉娜是一位性情沉稳的女子，她镇定地站在入口处…” → “还是有人竟然以令人吃惊的愚蠢把雕塑扔到了地上” → “她不禁惊呼” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Curator Lena stood poised at the entrance</span>，<span class=\"keyword\">a woman of calm disposition</span> 为 Lena 的同位语，poised 为形容词作表语/状语表示“镇定的”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">her pale complexion betraying only the slightest alarm</span> 为独立主格结构作伴随状语，betraying 为现在分词，betray 此处意为“流露出”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">She had taken every precaution</span>，冒号后 security cameras, guards, and locked display cases 为 precaution 的同位列举。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">someone had managed to toss the sculpture to the floor</span>，manage to do sth.（设法做到）为固定搭配，<span class=\"keyword\">with startling stupidity</span> 为方式状语。",
                "<span class=\"keyword\">地道表达</span>：末句为直接引语 <span class=\"keyword\">Who would do such a thing</span>，<span class=\"keyword\">she could not help but exclaim</span> 中 cannot help but do（不禁做某事）为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：disposition 出现在“of calm disposition”中，本段取“性情”义；poised 出现在“stood poised at the entrance”中，本段取“泰然自若的”义；complexion 出现在“her pale complexion betraying only the”中，本段取“肤色”义；precaution 出现在“taken every precaution”中，本段取“预防措施”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col2-p3",
            "segments": [
              "The prime suspect was a ",
              {
                "vocabId": "s6col2-juvenile",
                "text": "juvenile"
              },
              " visitor, a teenager known for his ",
              {
                "vocabId": "s6col2-unorthodox",
                "text": "unorthodox"
              },
              " behavior and his ",
              {
                "vocabId": "s6col2-indifference",
                "text": "indifference"
              },
              " to rules. He had been seen lingering near the exhibit, sharing an ",
              {
                "vocabId": "s6col2-anecdote",
                "text": "anecdote"
              },
              " about how he wanted to ",
              {
                "vocabId": "s6col2-emulate",
                "text": "emulate"
              },
              " famous art vandals. The guards, ",
              {
                "vocabId": "s6col2-obedient",
                "text": "obedient"
              },
              " to protocol, had ",
              {
                "vocabId": "s6col2-promptly",
                "text": "promptly"
              },
              " escorted him to a back room, but they could not ",
              {
                "vocabId": "s6col2-expel",
                "text": "expel"
              },
              " him without proof."
            ],
            "analysis": {
              "translation": "头号嫌疑犯是一个未成年访客，一个以不循常规的行为和对规则漠不关心而闻名的少年。有人看到他在展品附近徘徊，还讲了一个轶事，说他想效仿著名的艺术破坏者。警卫们服从规定，迅速将他护送到一间后室，但没有证据就无法将他驱逐。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “头号嫌疑犯是一个未成年访客，一个以不循常规的行为和…” → “有人看到他在展品附近徘徊，还讲了一个轶事，说他想效…” → “警卫们服从规定，迅速将他护送到一间后室，但没有证据…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The prime suspect was a juvenile visitor</span>，<span class=\"keyword\">a teenager known for his unorthodox behavior and his indifference to rules</span> 为 visitor 的同位语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">known for his unorthodox behavior and his indifference to rules</span> 为过去分词短语作后置定语修饰 teenager，be known for（因……而闻名），indifference to（对……漠不关心）均为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">He had been seen lingering near the exhibit</span>，使用被动语态，<span class=\"keyword\">lingering near the exhibit</span> 为主语补足语（现在分词）。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">sharing an anecdote about how he wanted to emulate famous art vandals</span> 为现在分词短语作伴随状语，how 引导宾语从句作 about 的宾语，emulate 意为“效仿”。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">the guards had promptly escorted him to a back room</span>，<span class=\"keyword\">obedient to protocol</span> 为形容词短语作状语。",
                "<span class=\"keyword\">逻辑衔接</span>：<span class=\"keyword\">but they could not expel him without proof</span> 为转折并列分句，without proof 为条件状语。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">语境搭配</span>：juvenile 出现在“was a juvenile visitor”中，本段取“青少年的”义；unorthodox 出现在“for his unorthodox behavior and his”中，本段取“非正统的”义；indifference 出现在“and his indifference to rules”中，本段取“冷漠”义；anecdote 出现在“sharing an anecdote about how he”中，本段取“轶事”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col2-p4",
            "segments": [
              "Detective Marsh arrived to ",
              {
                "vocabId": "s6col2-inspect",
                "text": "inspect"
              },
              " the scene. He was ",
              {
                "vocabId": "s6col2-proficient",
                "text": "proficient"
              },
              " in art crimes and had a ",
              {
                "vocabId": "s6col2-benign",
                "text": "benign"
              },
              " manner that put witnesses at ease. He began a ",
              {
                "vocabId": "s6col2-discourse",
                "text": "discourse"
              },
              " with the staff, hoping to ",
              {
                "vocabId": "s6col2-commend",
                "text": "commend"
              },
              " whoever had acted responsibly. He would ",
              {
                "vocabId": "s6col2-ponder",
                "text": "ponder"
              },
              " the evidence: a small ",
              {
                "vocabId": "s6col2-accessory",
                "text": "accessory"
              },
              ", a dropped earring, lay near the damaged trophy."
            ],
            "analysis": {
              "translation": "马什探长到达现场进行勘查。他精通艺术犯罪，举止温和，让证人们感到轻松。他开始与工作人员交谈，希望能表扬那些负责任行事的人。他会仔细思考证据：一件小饰物，一只掉落的耳环，就躺在受损的奖杯旁边。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “马什探长到达现场进行勘查” → “他开始与工作人员交谈，希望能表扬那些负责任行事的人” → “他会仔细思考证据：一件小饰物，一只掉落的耳环，就躺…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Detective Marsh arrived to inspect the scene</span>，<span class=\"keyword\">to inspect the scene</span> 为动词不定式作目的状语。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">He was proficient in art crimes and had a benign manner</span>，be proficient in（精通）为固定搭配，<span class=\"keyword\">that put witnesses at ease</span> 为定语从句修饰 manner，put sb. at ease（使某人放松）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">He began a discourse with the staff</span>，<span class=\"keyword\">hoping to commend whoever had acted responsibly</span> 为现在分词短语作伴随状语，whoever 引导宾语从句作 commend 的宾语。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">He would ponder the evidence</span>，冒号后 a small accessory, a dropped earring 为 evidence 的同位说明。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">a dropped earring, lay near the damaged trophy</span> 为独立句，lay（lie 的过去式）意为“位于、躺”，dropped 为过去分词作定语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">语境搭配</span>：inspect 出现在“arrived to inspect the scene”中，本段取“检查”义；proficient 出现在“He was proficient in art crimes”中，本段取“熟练的”义；benign 出现在“had a benign manner that put”中，本段取“良性的”义；discourse 出现在“began a discourse with the staff”中，本段取“论述”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col2-p5",
            "segments": [
              "The truth, when it emerged, was ",
              {
                "vocabId": "s6col2-profoundly",
                "text": "profoundly"
              },
              " surprising. It was not the teenager but a ",
              {
                "vocabId": "s6col2-toddler",
                "text": "toddler"
              },
              ", wandering unseen, who had bumped the pedestal and let the sculpture ",
              {
                "vocabId": "s6col2-slam",
                "text": "slam"
              },
              " to the floor. The case was closed, and the gallery learned that even the best precautions can fail."
            ],
            "analysis": {
              "translation": "真相浮出水面时，令人深感意外。不是那个少年，而是一个蹒跚学步的小孩，在无人注意时四处游荡，撞到了底座，让雕塑砰然摔到地上。案件就此了结，美术馆也认识到，即便是最好的预防措施也可能失败。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “真相浮出水面时，令人深感意外” → “不是那个少年，而是一个蹒跚学步的小孩，在无人注意时…” → “案件就此了结，美术馆也认识到，即便是最好的预防措施…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The truth was profoundly surprising</span>，<span class=\"keyword\">when it emerged</span> 为时间状语从句，emerge 意为“浮出水面”。",
                "<span class=\"keyword\">语境辨析</span>：第二句为强调句型的变体 <span class=\"keyword\">It was not the teenager but a toddler...who had bumped the pedestal and let the sculpture slam to the floor</span>，使用 not...but...（不是……而是……）结构。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">wandering unseen</span> 为现在分词短语作伴随状语，unseen 为过去分词作状语表示“未被看见地”。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">who had bumped the pedestal and let the sculpture slam to the floor</span> 为定语从句修饰 toddler，bumped 和 let 为并列谓语，let sb. do sth.（让……做……）中 slam 为不带 to 的不定式作宾补。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：末句由 and 连接两个并列分句，<span class=\"keyword\">the gallery learned that even the best precautions can fail</span> 中 that 引导宾语从句，even 表让步。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：profoundly 出现在“was profoundly surprising”中，本段取“深刻地”义；toddler 出现在“but a toddler”中，本段取“学步儿童”义；slam 出现在“the sculpture slam to the floor”中，本段取“砰地关上”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s6col3",
        "number": 3,
        "audio": {
          "src": "audio/list6_col3.mp3",
          "cues": [[2.52,2.71],[2.71,2.9],[2.9,3.2],[3.2,3.68],[3.68,4.06],[4.06,4.42],[4.42,4.84],[4.84,4.87],[4.87,5.1],[5.1,6.42],[6.42,6.45],[6.45,6.74],[6.74,7.12],[7.12,7.4],[7.4,7.72],[7.72,8.04],[8.04,8.6],[8.6,9.08],[9.08,9.68],[9.68,10.16],[10.16,10.6],[10.6,11.08],[11.08,11.36],[11.36,11.94],[12.54,12.82],[12.82,13.08],[13.18,13.56],[13.56,14],[14,14.26],[14.26,14.62],[14.62,14.94],[14.94,15.24],[15.24,15.6],[16.36,16.48],[16.48,16.76],[16.76,17.24],[17.64,17.8],[17.8,18.32],[18.32,18.76],[18.76,18.94],[18.94,19.14],[19.14,19.44],[19.44,20],[20.3,20.44],[20.44,20.72],[20.72,20.92],[20.92,21.06],[21.06,21.22],[21.22,21.54],[21.54,21.88],[21.88,22.28],[23,23.18],[23.18,23.46],[23.46,23.92],[23.92,24.16],[24.16,24.4],[24.4,24.72],[24.72,25.04],[25.04,25.22],[25.22,25.62],[25.62,26.7],[26.7,26.73],[26.73,26.9],[26.9,27.34],[27.34,27.56],[27.56,27.9],[27.9,28.28],[28.28,28.4],[28.4,28.58],[28.58,28.84],[28.84,29.12],[29.12,29.68],[30,30.66],[30.66,31.14],[31.4,31.68],[31.68,31.86],[31.86,32.18],[32.18,32.38],[32.38,32.78],[32.78,33.12],[33.12,33.34],[33.34,33.94],null,[34.48,34.58],[34.58,34.84],[34.84,35.1],[35.1,35.36],[35.36,35.56],[35.56,35.84],[35.84,36.38],[36.38,36.72],[37.38,37.56],[37.56,37.78],[37.78,38.14],[38.14,38.44],[38.44,38.72],[38.72,39.02],[39.02,39.48],[39.48,40.86],[40.86,40.91],[40.91,41.24],[41.24,41.62],[41.62,41.94],[41.94,42.18],[42.18,42.52],[42.52,42.74],[42.74,42.98],[42.98,43.28],[43.78,43.94],[43.94,44.76],[44.76,44.81],[44.81,45],[45,45.24],[45.24,45.9],[45.9,45.92],[45.92,46.08],[46.08,46.72],[47.4,47.62],[47.62,47.94],[47.94,49.02],[49.02,49.06],[49.06,49.28],[49.28,49.54],[49.54,50.14],[50.14,50.16],[50.16,50.38],[50.38,50.62],[50.62,51.08],[51.4,51.62],[51.62,51.94],[51.94,52.24],[52.24,53],[53.56,53.84],[53.84,54.08],[54.08,54.38],[54.38,54.74],[54.74,55.02],[55.02,55.3],[55.3,56.28],[56.28,56.42],[56.42,56.56],[56.56,56.84],[56.84,57.14],[57.88,57.94],[57.94,58.42],[58.6,59.08],[59.4,59.44],[59.44,59.76],[59.76,60.28],[60.28,60.32],[60.32,60.5],[60.5,61.02],[61.7,61.88],[61.88,62.16],[62.16,62.54],[62.54,62.94],[62.94,63.2],[63.2,63.64],[63.84,63.96],[63.96,64.18],[64.18,64.4],[64.4,64.64],[64.64,64.76],[64.76,65],[65,65.46],[65.46,66.06],[66.06,66.2],[66.2,66.5],[66.5,66.84],[66.84,67.14],[67.14,67.46],[67.46,68],[68,68.3],[68.3,68.64],[69.32,69.54],[69.54,69.76],[69.76,70.08],[70.08,70.52],[70.52,71.04],[71.04,71.09],[71.09,71.46],[71.46,71.74],[71.74,72.08],[72.08,72.46],[72.9,73.3],[73.3,73.34],[73.34,73.54],[73.54,73.74],[73.74,73.94],[73.94,74.28],[74.58,74.76],[74.76,75.1],[75.62,75.8],[75.8,76.26],[76.26,76.54],[76.54,76.88],[76.88,77.24],[77.24,77.64],[78.3,78.54],[78.54,78.88],[78.88,79.24],[79.24,79.46],[79.46,79.66],[79.66,79.96],[79.96,80.4],[80.4,80.72],[80.72,81.04],[81.68,81.88],[81.88,82.12],[82.12,82.38],[82.38,82.64],[82.64,82.82],[82.82,83.12],[83.12,84.02],null,[84.02,84.46],[84.46,84.7],[84.7,84.98],[84.98,85.48],[85.48,86.14],[86.8,86.96],[86.96,87.4],[87.74,87.98],[87.98,88.54],[88.54,89.1],[89.1,89.4],[89.4,89.66],[89.66,90.3],[90.74,91],[91,91.26],[91.26,91.4],[91.4,91.66],[91.66,91.9],[91.9,92.2],[92.2,92.52],[92.52,93.02],[93.7,93.88],[93.88,94.14],[94.14,94.82],[94.82,94.85],[94.85,95.06],[95.06,95.46],[95.84,96.12],[96.12,96.36],[96.36,96.64],[96.64,96.98],[96.98,97.24],[97.5,97.68],[97.68,97.9],[97.9,98.14],[98.14,98.38],[98.38,98.82],[98.82,99.22],[99.22,99.72],[99.72,100.16],[100.16,100.76],[101.76,101.96],[101.96,102.26],[102.26,102.6],[102.6,103.12],[103.12,103.18],[103.18,103.56],[104.02,104.28],[104.28,104.64],[104.64,105.14],[105.14,105.72],[105.72,106.14],[106.14,106.4],[106.4,106.72],[106.72,107.12],[107.12,107.36],[107.36,107.92],[108.42,108.6],[108.6,108.86],[108.86,109.1],[109.1,109.34],[109.34,109.64],[109.64,109.9],[109.9,110.26],[110.26,110.56],[110.56,110.94],[110.94,111.24],[111.24,111.5],[111.5,111.94],[111.94,112.3],[112.3,112.62]]
        },
        "title": "第三列",
        "theme": {
          "zh": "校园竞赛丑闻",
          "en": "Campus Competition Scandal"
        },
        "words": [
          {
            "id": "s6col3-aesthetics",
            "word": "aesthetics",
            "pos": "n.",
            "meaning": "美学"
          },
          {
            "id": "s6col3-barren",
            "word": "barren",
            "pos": "adj.",
            "meaning": "贫瘠的"
          },
          {
            "id": "s6col3-defect",
            "word": "defect",
            "pos": "n.",
            "meaning": "缺陷"
          },
          {
            "id": "s6col3-portrayal",
            "word": "portrayal",
            "pos": "n.",
            "meaning": "描绘"
          },
          {
            "id": "s6col3-sketch",
            "word": "sketch",
            "pos": "n./v.",
            "meaning": "草图；素描"
          },
          {
            "id": "s6col3-integration",
            "word": "integration",
            "pos": "n.",
            "meaning": "整合"
          },
          {
            "id": "s6col3-baffle",
            "word": "baffle",
            "pos": "v.",
            "meaning": "使困惑"
          },
          {
            "id": "s6col3-delicacy",
            "word": "delicacy",
            "pos": "n.",
            "meaning": "美味；精致"
          },
          {
            "id": "s6col3-acupuncture",
            "word": "acupuncture",
            "pos": "n.",
            "meaning": "针灸"
          },
          {
            "id": "s6col3-remnant",
            "word": "remnant",
            "pos": "n.",
            "meaning": "残余"
          },
          {
            "id": "s6col3-salient",
            "word": "salient",
            "pos": "adj.",
            "meaning": "显著的"
          },
          {
            "id": "s6col3-mediocre",
            "word": "mediocre",
            "pos": "adj.",
            "meaning": "平庸的"
          },
          {
            "id": "s6col3-aquatic",
            "word": "aquatic",
            "pos": "adj.",
            "meaning": "水生的"
          },
          {
            "id": "s6col3-immerse",
            "word": "immerse",
            "pos": "v.",
            "meaning": "沉浸"
          },
          {
            "id": "s6col3-sovereign",
            "word": "sovereign",
            "pos": "adj.",
            "meaning": "主权的"
          },
          {
            "id": "s6col3-barge",
            "word": "barge",
            "pos": "v.",
            "meaning": "闯入"
          },
          {
            "id": "s6col3-versatile",
            "word": "versatile",
            "pos": "adj.",
            "meaning": "多才多艺的"
          },
          {
            "id": "s6col3-scrape",
            "word": "scrape",
            "pos": "v.",
            "meaning": "刮擦"
          },
          {
            "id": "s6col3-ripe",
            "word": "ripe",
            "pos": "adj.",
            "meaning": "成熟的"
          },
          {
            "id": "s6col3-surveillance",
            "word": "surveillance",
            "pos": "n.",
            "meaning": "监视"
          },
          {
            "id": "s6col3-icon",
            "word": "icon",
            "pos": "n.",
            "meaning": "图标；偶像"
          },
          {
            "id": "s6col3-inconspicuous",
            "word": "inconspicuous",
            "pos": "adj.",
            "meaning": "不显眼的"
          },
          {
            "id": "s6col3-extravagant",
            "word": "extravagant",
            "pos": "adj.",
            "meaning": "奢侈的"
          },
          {
            "id": "s6col3-complimentary",
            "word": "complimentary",
            "pos": "adj.",
            "meaning": "赞美的；免费的"
          },
          {
            "id": "s6col3-worship",
            "word": "worship",
            "pos": "v./n.",
            "meaning": "崇拜"
          },
          {
            "id": "s6col3-solemn",
            "word": "solemn",
            "pos": "adj.",
            "meaning": "庄严的"
          },
          {
            "id": "s6col3-escalate",
            "word": "escalate",
            "pos": "v.",
            "meaning": "升级"
          },
          {
            "id": "s6col3-interval",
            "word": "interval",
            "pos": "n.",
            "meaning": "间隔"
          },
          {
            "id": "s6col3-scrutiny",
            "word": "scrutiny",
            "pos": "n.",
            "meaning": "审查"
          },
          {
            "id": "s6col3-potent",
            "word": "potent",
            "pos": "adj.",
            "meaning": "强有力的"
          },
          {
            "id": "s6col3-moist",
            "word": "moist",
            "pos": "adj.",
            "meaning": "潮湿的"
          }
        ],
        "paragraphs": [
          {
            "id": "s6col3-p1",
            "segments": [
              "The campus art competition had always been a ",
              {
                "vocabId": "s6col3-sovereign",
                "text": "sovereign"
              },
              " tradition, a celebration where students could ",
              {
                "vocabId": "s6col3-immerse",
                "text": "immerse"
              },
              " themselves in creativity and showcase their ",
              {
                "vocabId": "s6col3-versatile",
                "text": "versatile"
              },
              " talents. This year, however, the event was ",
              {
                "vocabId": "s6col3-ripe",
                "text": "ripe"
              },
              " for scandal. The winning entry, an ",
              {
                "vocabId": "s6col3-extravagant",
                "text": "extravagant"
              },
              " painting of an ",
              {
                "vocabId": "s6col3-aquatic",
                "text": "aquatic"
              },
              " scene, was supposed to be an ",
              {
                "vocabId": "s6col3-icon",
                "text": "icon"
              },
              " of excellence. But during the ",
              {
                "vocabId": "s6col3-interval",
                "text": "interval"
              },
              " between judging and the awards ceremony, a rumor began to ",
              {
                "vocabId": "s6col3-escalate",
                "text": "escalate"
              },
              " that the work was not original."
            ],
            "analysis": {
              "translation": "校园艺术比赛一直以来都是一项至高无上的传统，一场让学生们沉浸于创造力、展示多才多艺的盛会。然而今年，这一赛事却酝酿着丑闻。获奖作品——一幅奢华的水下场景画——本应是卓越的象征。但在评审与颁奖典礼之间的间隙，一个谣言开始升级，称该作品并非原创。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “校园艺术比赛一直以来都是一项至高无上的传统，一场让…” → “获奖作品——一幅奢华的水下场景画——本应是卓越的象…” → “在评审与颁奖典礼之间的间隙，一个谣言开始升级，称该…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The campus art competition had always been a sovereign tradition</span>，<span class=\"keyword\">a celebration where students could immerse themselves in creativity and showcase their versatile talents</span> 为 tradition 的同位语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">where students could immerse themselves in creativity and showcase their versatile talents</span> 为定语从句修饰 celebration，immerse oneself in（沉浸于）为固定搭配，immers 和 showcase 为并列谓语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">the event was ripe for scandal</span>，be ripe for（……的时机成熟/酝酿着）为固定搭配，however 表转折。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">The winning entry was supposed to be an icon of excellence</span>，be supposed to（本应该）为固定搭配，破折号间 an extravagant painting of an aquatic scene 为 entry 的同位语。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">a rumor began to escalate that the work was not original</span>，<span class=\"keyword\">during the interval between judging and the awards ceremony</span> 为时间状语，<span class=\"keyword\">that the work was not original</span> 为 rumor 的同位语从句（后置）。",
                "<span class=\"keyword\">语境搭配</span>：sovereign 出现在“been a sovereign tradition”中，本段取“主权的”义；immerse 出现在“students could immerse themselves in creativity”中，本段取“沉浸”义；versatile 出现在“showcase their versatile talents”中，本段取“多才多艺的”义；ripe 出现在“event was ripe for scandal”中，本段取“成熟的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col3-p2",
            "segments": [
              "Professor Lin, known for her ",
              {
                "vocabId": "s6col3-solemn",
                "text": "solemn"
              },
              " demeanor and sharp ",
              {
                "vocabId": "s6col3-scrutiny",
                "text": "scrutiny"
              },
              ", decided to ",
              {
                "vocabId": "s6col3-barge",
                "text": "barge"
              },
              " into the studio to investigate. What she found would ",
              {
                "vocabId": "s6col3-baffle",
                "text": "baffle"
              },
              " the entire faculty: a ",
              {
                "vocabId": "s6col3-salient",
                "text": "salient"
              },
              "\n",
              {
                "vocabId": "s6col3-defect",
                "text": "defect"
              },
              " in the ",
              {
                "vocabId": "s6col3-portrayal",
                "text": "portrayal"
              },
              " of the fish, which bore a striking resemblance to a published photograph. Under careful examination, a faint ",
              {
                "vocabId": "s6col3-remnant",
                "text": "remnant"
              },
              " of a watermark was visible, ",
              {
                "vocabId": "s6col3-moist",
                "text": "moist"
              },
              " with fresh overpainting. The discovery would ",
              {
                "vocabId": "s6col3-scrape",
                "text": "scrape"
              },
              " away the artist's reputation in an instant."
            ],
            "analysis": {
              "translation": "林教授以严肃的举止和敏锐的审视而闻名，决定闯入工作室进行调查。她的发现令整个系大惑不解：鱼的表现中存在一个显著的缺陷，与一张已发表的照片惊人地相似。仔细检查后，隐约可见一处水印的残留痕迹，因新涂的颜料而湿润。这一发现会瞬间刮去艺术家的声誉。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “林教授以严肃的举止和敏锐的审视而闻名，决定闯入工作…” → “仔细检查后，隐约可见一处水印的残留痕迹，因新涂的颜…” → “这一发现会瞬间刮去艺术家的声誉” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Professor Lin decided to barge into the studio to investigate</span>，<span class=\"keyword\">known for her solemn demeanor and sharp scrutiny</span> 为过去分词短语作后置定语修饰 Lin，barge into（闯入）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">What she found would baffle the entire faculty</span>，<span class=\"keyword\">What she found</span> 为主语从句，baffle 意为“使困惑”。",
                "<span class=\"keyword\">结构拆解</span>：冒号后 <span class=\"keyword\">a salient defect in the portrayal of the fish, which bore a striking resemblance to a published photograph</span> 为 found 的宾语同位说明，<span class=\"keyword\">which bore a striking resemblance to a published photograph</span> 为定语从句修饰 defect，bear a resemblance to（与……相似）为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">a faint remnant of a watermark was visible</span>，<span class=\"keyword\">Under careful examination</span> 为条件/时间状语，<span class=\"keyword\">moist with fresh overpainting</span> 为形容词短语作伴随状语。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">The discovery would scrape away the artist's reputation in an instant</span>，scrape away（刮去、抹去）为固定搭配，in an instant（瞬间）为时间状语。",
                "<span class=\"keyword\">语境搭配</span>：solemn 出现在“for her solemn demeanor and sharp”中，本段取“庄严的”义；scrutiny 出现在“and sharp scrutiny”中，本段取“审查”义；barge 出现在“decided to barge into the studio”中，本段取“闯入”义；baffle 出现在“found would baffle the entire faculty”中，本段取“使困惑”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col3-p3",
            "segments": [
              "The student, confronted, could only ",
              {
                "vocabId": "s6col3-sketch",
                "text": "sketch"
              },
              " a vague defense. His argument was ",
              {
                "vocabId": "s6col3-mediocre",
                "text": "mediocre"
              },
              " at best, and his claim that the work celebrated the ",
              {
                "vocabId": "s6col3-integration",
                "text": "integration"
              },
              " of Eastern and Western ",
              {
                "vocabId": "s6col3-aesthetics",
                "text": "aesthetics"
              },
              " rang hollow. \"You treat this competition like a ",
              {
                "vocabId": "s6col3-delicacy",
                "text": "delicacy"
              },
              " to be consumed, not a craft to be honored,\" Lin declared. She refused to ",
              {
                "vocabId": "s6col3-worship",
                "text": "worship"
              },
              " false talent."
            ],
            "analysis": {
              "translation": "这名学生被当面对质，却只能草草拼凑出一个含糊的辩护。他的论点充其量只是平庸，他声称该作品赞颂了东西方美学的融合，这番话听起来空洞无力。“你把这场比赛当作一道可以品尝的美味，而不是一门应当敬重的手艺，”林教授宣称。她拒绝崇拜虚假的才华。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这名学生被当面对质，却只能草草拼凑出一个含糊的辩护” → “你把这场比赛当作一道可以品尝的美味，而不是一门应当…” → “她拒绝崇拜虚假的才华” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The student could only sketch a vague defense</span>，<span class=\"keyword\">confronted</span> 为过去分词作状语，表示“被对质时”，sketch 此处作动词意为“草草拼凑”。",
                "<span class=\"keyword\">地道表达</span>：第二句由 and 连接两个并列分句：<span class=\"keyword\">His argument was mediocre at best</span> 和 <span class=\"keyword\">his claim...rang hollow</span>，at best（充其量）为固定搭配，ring hollow（听起来空洞）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that the work celebrated the integration of Eastern and Western aesthetics</span> 为 claim 的同位语从句，integration of...（……的融合）为固定搭配。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">结构拆解</span>：第三句为直接引语 <span class=\"keyword\">You treat this competition like a delicacy to be consumed, not a craft to be honored</span>，使用 not...but...的变体结构，<span class=\"keyword\">to be consumed</span> 和 <span class=\"keyword\">to be honored</span> 为被动语态的动词不定式作后置定语。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">She refused to worship false talent</span>，refuse to do sth.（拒绝做某事）为固定搭配，worship 意为“崇拜”。",
                "<span class=\"keyword\">语境搭配</span>：sketch 出现在“could only sketch a vague defense”中，本段取“草图”义；mediocre 出现在“argument was mediocre at best”中，本段取“平庸的”义；integration 出现在“celebrated the integration of Eastern and”中，本段取“整合”义；aesthetics 出现在“and Western aesthetics rang hollow”中，本段取“美学”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col3-p4",
            "segments": [
              "The ",
              {
                "vocabId": "s6col3-surveillance",
                "text": "surveillance"
              },
              " footage from the studio confirmed the cheating. The student had tried to remain ",
              {
                "vocabId": "s6col3-inconspicuous",
                "text": "inconspicuous"
              },
              ", but the cameras captured everything. The committee, offering ",
              {
                "vocabId": "s6col3-complimentary",
                "text": "complimentary"
              },
              " praise to honest contestants, decided to bar the cheater from future events. The scandal proved a ",
              {
                "vocabId": "s6col3-potent",
                "text": "potent"
              },
              " lesson: true art cannot be faked, and even the ",
              {
                "vocabId": "s6col3-barren",
                "text": "barren"
              },
              " landscape of dishonesty yields consequences. Lin later visited the campus clinic, where students practiced ",
              {
                "vocabId": "s6col3-acupuncture",
                "text": "acupuncture"
              },
              " and other therapies to relieve stress, and paused to praise an honest young painter whose work was genuinely his own."
            ],
            "analysis": {
              "translation": "工作室的监控录像证实了作弊行为。这名学生曾试图保持不引人注目，但摄像头拍下了一切。委员会向诚实的参赛者给予赞许之词，同时决定禁止该作弊者参加未来的赛事。这桩丑闻证明了一个深刻的教训：真正的艺术无法伪造，即便是不诚实这片贫瘠之地也会结出后果。林教授后来参观了校园诊所，学生们在那里练习针灸和其他疗法以缓解压力，她驻足称赞了一位诚实的年轻画家，其作品确实是他自己的。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “工作室的监控录像证实了作弊行为” → “委员会向诚实的参赛者给予赞许之词，同时决定禁止该作…” → “林教授后来参观了校园诊所，学生们在那里练习针灸和其…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The surveillance footage from the studio confirmed the cheating</span>，<span class=\"keyword\">from the studio</span> 为介词短语作后置定语修饰 footage。",
                "<span class=\"keyword\">地道表达</span>：第二句由 but 连接两个转折分句：<span class=\"keyword\">The student had tried to remain inconspicuous</span> 和 <span class=\"keyword\">the cameras captured everything</span>，inconspicuous 意为“不引人注目的”。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">The committee decided to bar the cheater from future events</span>，<span class=\"keyword\">offering complimentary praise to honest contestants</span> 为现在分词短语作伴随状语，bar sb. from（禁止某人参加）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">The scandal proved a potent lesson</span>，冒号后 <span class=\"keyword\">true art cannot be faked, and even the barren landscape of dishonesty yields consequences</span> 为 lesson 的同位说明，由 and 连接两个并列分句。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">Lin later visited the campus clinic</span>，<span class=\"keyword\">where students practiced acupuncture and other therapies to relieve stress</span> 为定语从句修饰 clinic，<span class=\"keyword\">to relieve stress</span> 为动词不定式作目的状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">and paused to praise an honest young painter whose work was genuinely his own</span> 为并列谓语，<span class=\"keyword\">whose work was genuinely his own</span> 为定语从句修饰 painter。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：surveillance 出现在“The surveillance footage from the”中，本段取“监视”义；inconspicuous 出现在“to remain inconspicuous”中，本段取“不显眼的”义；complimentary 出现在“offering complimentary praise to honest”中，本段取“赞美的”义；potent 出现在“proved a potent lesson”中，本段取“强有力的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s6col4",
        "number": 4,
        "audio": {
          "src": "audio/list6_col4.mp3",
          "cues": [[2.28,2.38],[2.38,2.56],[2.56,2.9],[2.9,3.18],[3.18,3.26],[3.26,3.44],[3.44,3.56],[3.56,3.8],[3.8,4.1],[4.1,4.3],[4.3,4.66],[4.66,4.71],[4.71,4.98],[4.98,5.18],[5.18,5.52],[5.52,6.02],[6.96,7.08],[7.08,7.52],[7.52,7.88],[7.88,7.96],[7.96,8.12],[8.12,8.46],[8.46,8.56],[8.56,8.8],[9.14,9.2],[9.2,9.3],[9.3,9.48],[9.48,9.84],[9.84,10.48],[10.48,10.88],[10.88,11.24],null,[11.24,11.66],[11.66,12.32],[13.1,13.24],[13.24,13.6],[13.6,13.92],[13.92,14.56],[14.56,14.6],[14.6,14.84],[14.84,15.22],[15.22,15.52],[16.24,16.36],[16.36,16.64],[16.64,16.92],[16.92,17.16],[17.16,17.44],[17.44,17.56],[17.56,17.96],[17.96,18.58],[18.58,19.22],[19.22,19.68],[19.68,19.92],[19.92,20.22],[20.22,20.48],[20.48,20.92],[20.92,21.16],[21.16,21.58],[21.58,21.82],[22.78,23.54],[23.54,23.57],[23.57,23.8],[23.8,24.1],[24.1,24.26],[24.26,24.64],[24.64,25.22],[25.22,25.42],[25.42,25.76],[25.76,26.08],[26.72,27.08],[27.08,27.46],[27.46,27.86],[27.86,28.06],[28.06,28.46],[28.46,29.24],[29.24,29.4],[29.4,29.5],[29.5,30],[30,30.18],[30.18,30.6],[30.6,31.16],[31.16,31.96],null,[32.62,32.86],[32.86,33.08],[33.08,33.26],[33.26,33.58],[33.58,34.02],[34.02,34.78],[34.78,35.02],[35.02,35.16],[35.16,35.6],[35.6,36.16],[36.16,36.4],[36.4,36.62],[36.62,37],[37,37.26],[37.26,37.4],[37.4,37.84],[38.82,38.98],[38.98,39.32],[39.5,39.8],[39.8,40.1],[40.1,40.18],[40.18,40.5],[40.5,40.76],[40.76,41.12],[41.7,41.92],[41.92,42.24],[42.24,42.48],[42.48,42.84],[42.84,42.98],[42.98,43.26],[43.26,43.46],[43.46,43.82],[43.82,44.42],null,[45.08,45.14],[45.14,45.28],[45.28,45.42],[45.42,46],[46,46.26],[46.26,46.58],[46.58,46.72],[46.72,47.14],[47.14,47.56],[47.56,47.6],[47.6,47.86],[47.86,48.26],[48.26,48.52],[48.52,48.8],[48.8,49.16],[49.16,49.6],[49.6,50],[50.82,50.94],[50.94,51.2],[51.2,51.72],[51.72,51.92],[51.92,52.22],[52.22,52.5],[52.5,52.72],[52.72,53.18],[53.18,54.72],[54.72,54.75],[54.75,54.88],[54.88,55.28],null,[55.28,55.94],[55.94,56.62],[56.62,56.68],[56.68,56.9],[57.34,57.48],[57.48,57.92],[57.92,57.96],[57.96,58.22],[58.22,58.92],[58.92,59.18],[59.18,59.54],[59.54,59.98],[59.98,60.38],[61.02,61.2],[61.2,61.64],[61.64,61.68],[61.68,61.9],[61.9,62.26],[62.26,62.8],[62.8,63.3],[63.3,63.33],[63.33,63.56],[63.56,63.9],[64.46,64.56],[64.56,64.64],[64.64,65.06],[65.06,65.1],[65.1,65.32],[65.32,65.5],[65.5,65.78],[65.78,66.06],[66.06,66.14],[66.14,66.4],[67.44,67.62],[67.62,67.74],[67.74,68.14],[68.14,68.22],[68.22,68.48],[68.48,68.72],[68.72,69.1],[69.1,69.56],[69.56,69.66],[69.66,70.16],[70.16,70.42],[71.14,71.24],[71.24,71.46],[71.46,71.86],[71.86,72.1],[72.1,72.32],[72.32,72.66],[72.66,73.02],[73.02,73.38],[73.38,73.52],[73.52,73.68],[73.68,73.92],[73.92,73.96],[73.96,74.44],[75.18,75.36],[75.36,75.62],[75.62,75.96],[75.96,76.14],[76.14,76.7],[76.7,77.1],[77.1,77.26],[77.26,77.68],[77.68,77.98],[77.98,78.26],[78.26,78.78],[79.44,79.64],[79.64,79.78],[79.78,80.02],[80.02,80.5],[80.5,80.94],[80.94,81.04],[81.04,81.32],[81.32,81.7],[81.7,82.1],[83.32,83.42],[83.42,83.62],[83.62,84.02],[84.02,84.4],[84.4,84.58],[84.58,84.9],[84.9,85.12],[85.12,85.52],[85.52,85.68],[85.68,86.04],[86.59,86.86],[86.86,87.14],[87.14,87.52],[87.52,87.96],[87.96,88.34],[88.34,88.54],[88.54,89.02],[89.02,89.2],[89.2,89.68],[90.26,90.46],[90.46,90.94],[90.94,91.18],[91.18,91.84],[91.84,92.54],[92.54,93.02],[93.02,93.32],[93.32,93.58],[93.58,93.98],[93.98,94.22],[94.22,95.12],[95.78,95.98],[95.98,96.1],[96.1,96.3],[96.46,96.48],[96.48,96.74],[96.74,97],[97,97.2],[97.2,97.58],[97.8,97.88],[97.88,98.28],[98.28,98.52],[98.52,99.08],[99.08,99.11],[99.11,99.32],[99.32,99.8],[99.8,100.04],[100.04,100.3],[100.3,100.92]]
        },
        "title": "第四列",
        "theme": {
          "zh": "旧工厂调查",
          "en": "Old Factory Investigation"
        },
        "words": [
          {
            "id": "s6col4-peculiar",
            "word": "peculiar",
            "pos": "adj.",
            "meaning": "奇怪的；特有的"
          },
          {
            "id": "s6col4-proximity",
            "word": "proximity",
            "pos": "n.",
            "meaning": "接近"
          },
          {
            "id": "s6col4-alteration",
            "word": "alteration",
            "pos": "n.",
            "meaning": "改变"
          },
          {
            "id": "s6col4-mandate",
            "word": "mandate",
            "pos": "n./v.",
            "meaning": "授权；命令"
          },
          {
            "id": "s6col4-vague",
            "word": "vague",
            "pos": "adj.",
            "meaning": "模糊的"
          },
          {
            "id": "s6col4-unbiased",
            "word": "unbiased",
            "pos": "adj.",
            "meaning": "无偏见的"
          },
          {
            "id": "s6col4-eject",
            "word": "eject",
            "pos": "v.",
            "meaning": "弹出；驱逐"
          },
          {
            "id": "s6col4-ignite",
            "word": "ignite",
            "pos": "v.",
            "meaning": "点燃"
          },
          {
            "id": "s6col4-mighty",
            "word": "mighty",
            "pos": "adj.",
            "meaning": "强大的"
          },
          {
            "id": "s6col4-denial",
            "word": "denial",
            "pos": "n.",
            "meaning": "否认"
          },
          {
            "id": "s6col4-discern",
            "word": "discern",
            "pos": "v.",
            "meaning": "辨别"
          },
          {
            "id": "s6col4-discernible",
            "word": "discernible",
            "pos": "adj.",
            "meaning": "可辨别的"
          },
          {
            "id": "s6col4-align",
            "word": "align",
            "pos": "v.",
            "meaning": "对齐；使一致"
          },
          {
            "id": "s6col4-physiological",
            "word": "physiological",
            "pos": "adj.",
            "meaning": "生理的"
          },
          {
            "id": "s6col4-indebted",
            "word": "indebted",
            "pos": "adj.",
            "meaning": "感激的；负债的"
          },
          {
            "id": "s6col4-trivial",
            "word": "trivial",
            "pos": "adj.",
            "meaning": "琐碎的"
          },
          {
            "id": "s6col4-novelty",
            "word": "novelty",
            "pos": "n.",
            "meaning": "新奇"
          },
          {
            "id": "s6col4-cluster",
            "word": "cluster",
            "pos": "n./v.",
            "meaning": "群；聚集"
          },
          {
            "id": "s6col4-whistle",
            "word": "whistle",
            "pos": "v./n.",
            "meaning": "吹口哨"
          },
          {
            "id": "s6col4-consolidate",
            "word": "consolidate",
            "pos": "v.",
            "meaning": "巩固"
          },
          {
            "id": "s6col4-refute",
            "word": "refute",
            "pos": "v.",
            "meaning": "反驳"
          },
          {
            "id": "s6col4-resignation",
            "word": "resignation",
            "pos": "n.",
            "meaning": "辞职"
          },
          {
            "id": "s6col4-verse",
            "word": "verse",
            "pos": "n.",
            "meaning": "诗句"
          },
          {
            "id": "s6col4-stump",
            "word": "stump",
            "pos": "v.",
            "meaning": "难住"
          },
          {
            "id": "s6col4-hasten",
            "word": "hasten",
            "pos": "v.",
            "meaning": "催促；加速"
          },
          {
            "id": "s6col4-fury",
            "word": "fury",
            "pos": "n.",
            "meaning": "狂怒"
          },
          {
            "id": "s6col4-compatibility",
            "word": "compatibility",
            "pos": "n.",
            "meaning": "兼容性"
          },
          {
            "id": "s6col4-dub",
            "word": "dub",
            "pos": "v.",
            "meaning": "授予称号；配音"
          },
          {
            "id": "s6col4-hitherto",
            "word": "hitherto",
            "pos": "adv.",
            "meaning": "迄今"
          },
          {
            "id": "s6col4-indulgence",
            "word": "indulgence",
            "pos": "n.",
            "meaning": "沉溺；纵容"
          },
          {
            "id": "s6col4-extravagance",
            "word": "extravagance",
            "pos": "n.",
            "meaning": "奢侈"
          },
          {
            "id": "s6col4-disparity",
            "word": "disparity",
            "pos": "n.",
            "meaning": "差距"
          },
          {
            "id": "s6col4-diagnosis",
            "word": "diagnosis",
            "pos": "n.",
            "meaning": "诊断"
          },
          {
            "id": "s6col4-sanitation",
            "word": "sanitation",
            "pos": "n.",
            "meaning": "卫生"
          }
        ],
        "paragraphs": [
          {
            "id": "s6col4-p1",
            "segments": [
              "The old factory on the edge of town had long been a place of ",
              {
                "vocabId": "s6col4-peculiar",
                "text": "peculiar"
              },
              " rumors. Its ",
              {
                "vocabId": "s6col4-proximity",
                "text": "proximity"
              },
              " to the river made it damp, and the poor ",
              {
                "vocabId": "s6col4-sanitation",
                "text": "sanitation"
              },
              " inside had, ",
              {
                "vocabId": "s6col4-hitherto",
                "text": "hitherto"
              },
              ", gone unreported. When Inspector Cole received a ",
              {
                "vocabId": "s6col4-mandate",
                "text": "mandate"
              },
              " to investigate, he approached the case with an ",
              {
                "vocabId": "s6col4-unbiased",
                "text": "unbiased"
              },
              " mind, determined to ",
              {
                "vocabId": "s6col4-discern",
                "text": "discern"
              },
              " the truth behind the workers' complaints."
            ],
            "analysis": {
              "translation": "镇边缘那座旧工厂长期以来一直是离奇传闻的发源地。它靠近河流，所以十分潮湿，而内部糟糕的卫生状况此前一直未被报告。当科尔督察接到调查的命令时，他以不偏不倚的态度着手此案，决心辨别工人们投诉背后的真相。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “镇边缘那座旧工厂长期以来一直是离奇传闻的发源地” → “它靠近河流，所以十分潮湿，而内部糟糕的卫生状况此前…” → “当科尔督察接到调查的命令时，他以不偏不倚的态度着手…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The old factory had long been a place of peculiar rumors</span>，<span class=\"keyword\">on the edge of town</span> 为地点状语，had long been 为过去完成进行时态的系表结构。",
                "<span class=\"keyword\">地道表达</span>：第二句由 and 连接两个并列分句：<span class=\"keyword\">Its proximity to the river made it damp</span> 和 <span class=\"keyword\">the poor sanitation inside had, hitherto, gone unreported</span>，proximity to（靠近）为固定搭配，make it damp 中 damp 为宾补。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">hitherto</span> 为副词意为“此前、迄今”，作插入语，<span class=\"keyword\">gone unreported</span> 中 gone 为系动词，unreported 为过去分词作表语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">he approached the case with an unbiased mind</span>，<span class=\"keyword\">When Inspector Cole received a mandate to investigate</span> 为时间状语从句，mandate 意为“命令、授权”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">determined to discern the truth behind the workers' complaints</span> 为过去分词短语作伴随状语，discern 意为“辨别”，behind the workers' complaints 为后置定语修饰 truth。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：peculiar 出现在“place of peculiar rumors”中，本段取“奇怪的”义；proximity 出现在“Its proximity to the river”中，本段取“接近”义；sanitation 出现在“the poor sanitation inside had”中，本段取“卫生”义；hitherto 出现在“hitherto”中，本段取“迄今”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col4-p2",
            "segments": [
              "Inside, a ",
              {
                "vocabId": "s6col4-cluster",
                "text": "cluster"
              },
              " of rusty machines stood in silent rows. The ",
              {
                "vocabId": "s6col4-disparity",
                "text": "disparity"
              },
              " between the owners' ",
              {
                "vocabId": "s6col4-extravagance",
                "text": "extravagance"
              },
              " and the workers' misery was immediately ",
              {
                "vocabId": "s6col4-discernible",
                "text": "discernible"
              },
              ". Cole could not ",
              {
                "vocabId": "s6col4-align",
                "text": "align"
              },
              " such ",
              {
                "vocabId": "s6col4-indulgence",
                "text": "indulgence"
              },
              " with the ",
              {
                "vocabId": "s6col4-physiological",
                "text": "physiological"
              },
              " toll the labor took on the employees. One worker, ",
              {
                "vocabId": "s6col4-indebted",
                "text": "indebted"
              },
              " to the company for housing, confessed that fumes from the vats would occasionally ",
              {
                "vocabId": "s6col4-ignite",
                "text": "ignite"
              },
              ", and that the management's ",
              {
                "vocabId": "s6col4-denial",
                "text": "denial"
              },
              " of any danger was a ",
              {
                "vocabId": "s6col4-trivial",
                "text": "trivial"
              },
              " lie meant to ",
              {
                "vocabId": "s6col4-consolidate",
                "text": "consolidate"
              },
              " their control."
            ],
            "analysis": {
              "translation": "在里面，一排排生锈的机器静默地矗立着。老板的奢靡与工人的悲惨之间的差距立刻就能辨别出来。科尔无法将这种放纵与劳动对雇员造成的生理伤害相调和。一名因住房而欠公司债务的工人承认，大缸里冒出的烟雾偶尔会起火，而管理层对任何危险的否认都是一个微不足道的谎言，旨在巩固他们的控制。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在里面，一排排生锈的机器静默地矗立着” → “科尔无法将这种放纵与劳动对雇员造成的生理伤害相调和” → “一名因住房而欠公司债务的工人承认，大缸里冒出的烟雾…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">a cluster of rusty machines stood in silent rows</span>，a cluster of（一排/一群）为固定搭配，in silent rows 为方式状语。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The disparity between the owners' extravagance and the workers' misery was immediately discernible</span>，between...and...连接两个对比对象，discernible 意为“可辨别的”。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Cole could not align such indulgence with the physiological toll the labor took on the employees</span>，align...with...（使……与……相一致）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">the labor took on the employees</span> 为省略 that 的定语从句修饰 toll，take a toll on（对……造成伤害/代价）为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">One worker confessed that fumes from the vats would occasionally ignite and that the management's denial of any danger was a trivial lie</span>，confessed 后接两个 that 引导的并列宾语从句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">indebted to the company for housing</span> 为过去分词短语作后置定语修饰 worker，be indebted to（欠……的债/人情）为固定搭配，<span class=\"keyword\">meant to consolidate their control</span> 为过去分词短语作后置定语修饰 lie。",
                "<span class=\"keyword\">语境搭配</span>：cluster 出现在“a cluster of rusty machines”中，本段取“群”义；disparity 出现在“The disparity between the owners'”中，本段取“差距”义；extravagance 出现在“the owners' extravagance and the workers'”中，本段取“奢侈”义；discernible 出现在“was immediately discernible”中，本段取“可辨别的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col4-p3",
            "segments": [
              "The situation seemed to ",
              {
                "vocabId": "s6col4-stump",
                "text": "stump"
              },
              " even the experienced inspector. A ",
              {
                "vocabId": "s6col4-vague",
                "text": "vague"
              },
              "\n",
              {
                "vocabId": "s6col4-verse",
                "text": "verse"
              },
              ", scratched into a wall, read like a warning: \"The ",
              {
                "vocabId": "s6col4-mighty",
                "text": "mighty"
              },
              " furnace never sleeps.\" Cole heard a sharp ",
              {
                "vocabId": "s6col4-whistle",
                "text": "whistle"
              },
              " escape from a cracked pipe, and he felt a surge of ",
              {
                "vocabId": "s6col4-fury",
                "text": "fury"
              },
              " at the negligence. He would ",
              {
                "vocabId": "s6col4-hasten",
                "text": "hasten"
              },
              " to file his ",
              {
                "vocabId": "s6col4-diagnosis",
                "text": "diagnosis"
              },
              " of the factory's ills."
            ],
            "analysis": {
              "translation": "这种情况似乎连经验丰富的督察也难住了。墙上刻着的一句模糊诗句读起来像是一个警告：“巨大的熔炉从不沉睡。”科尔听到一声尖锐的哨音从一根破裂的管道中逸出，他对这种疏忽涌起一股愤怒。他将尽快提交他对工厂弊病的诊断报告。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “这种情况似乎连经验丰富的督察也难住了” → “科尔听到一声尖锐的哨音从一根破裂的管道中逸出，他对…” → “他将尽快提交他对工厂弊病的诊断报告” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The situation seemed to stump even the experienced inspector</span>，seem to do sth.（似乎做某事），stump 此处作动词意为“难住”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">A vague verse, scratched into a wall, read like a warning</span>，<span class=\"keyword\">scratched into a wall</span> 为过去分词短语作后置定语（插入）修饰 verse，read like（读起来像）为固定搭配。",
                "<span class=\"keyword\">地道表达</span>：直接引语 <span class=\"keyword\">The mighty furnace never sleeps</span> 中使用拟人手法，furnace 意为“熔炉”。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Cole heard a sharp whistle escape from a cracked pipe</span>，heard sb./sth. do sth.（听到……做……）中 escape 为不带 to 的不定式作宾补。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">and he felt a surge of fury at the negligence</span> 为并列分句，a surge of（一股）为固定搭配，at the negligence 为原因状语。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">He would hasten to file his diagnosis of the factory's ills</span>，hasten to do（赶快做），diagnosis of（……的诊断）为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：stump 出现在“seemed to stump even the experienced”中，本段取“难住”义；vague 出现在“A vague verse”中，本段取“模糊的”义；verse 出现在“A vague verse”中，本段取“诗句”义；mighty 出现在“The mighty furnace never sleeps”中，本段取“强大的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col4-p4",
            "segments": [
              "The owners tried to ",
              {
                "vocabId": "s6col4-refute",
                "text": "refute"
              },
              " his findings and to ",
              {
                "vocabId": "s6col4-dub",
                "text": "dub"
              },
              " him a troublemaker. They argued that the ",
              {
                "vocabId": "s6col4-novelty",
                "text": "novelty"
              },
              " of new equipment would solve everything, and that any ",
              {
                "vocabId": "s6col4-alteration",
                "text": "alteration"
              },
              " to the schedule was unnecessary. But Cole refused to ",
              {
                "vocabId": "s6col4-eject",
                "text": "eject"
              },
              " the evidence from his report. He demanded their ",
              {
                "vocabId": "s6col4-resignation",
                "text": "resignation"
              },
              " if conditions did not improve, insisting that basic ",
              {
                "vocabId": "s6col4-compatibility",
                "text": "compatibility"
              },
              " between profit and human safety was non-negotiable."
            ],
            "analysis": {
              "translation": "老板们试图反驳他的调查结果，并给他贴上闹事者的标签。他们争辩说，新设备的新奇之处将解决一切问题，对时间表的任何改动都是不必要的。但科尔拒绝把证据从报告中剔除。他要求，如果条件不改善他们就辞职，并坚持认为利润与人的安全之间基本的兼容性是不容谈判的。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “老板们试图反驳他的调查结果，并给他贴上闹事者的标签” → “科尔拒绝把证据从报告中剔除” → “他要求，如果条件不改善他们就辞职，并坚持认为利润与…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The owners tried to refute his findings and to dub him a troublemaker</span>，tried 后接两个不定式作宾语，refute（反驳）与 dub（给……贴标签/称呼）为并列动作，a troublemaker 作 him 的宾补。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">They argued that the novelty of new equipment would solve everything, and that any alteration to the schedule was unnecessary</span>，argued 后接两个 that 引导的并列宾语从句。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Cole refused to eject the evidence from his report</span>，refuse to do（拒绝做），eject...from...（把……从……中剔除）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">He demanded their resignation if conditions did not improve</span>，<span class=\"keyword\">if conditions did not improve</span> 为条件状语从句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">insisting that basic compatibility between profit and human safety was non-negotiable</span> 为现在分词短语作伴随状语，insisting 后接 that 引导的宾语从句，between profit and human safety 为后置定语修饰 compatibility，non-negotiable 意为“不容谈判的”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：refute 出现在“tried to refute his findings and”中，本段取“反驳”义；dub 出现在“and to dub him a troublemaker”中，本段取“授予称号”义；novelty 出现在“that the novelty of new equipment”中，本段取“新奇”义；alteration 出现在“that any alteration to the schedule”中，本段取“改变”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s6col4-p5",
            "segments": [
              "In the end, the factory was shut down, and Cole's report became a landmark case in industrial reform."
            ],
            "analysis": {
              "translation": "最终，工厂被关闭了，科尔的报告成为了工业改革中的一个里程碑式案例。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段用一句话集中交代 “最终，工厂被关闭了，科尔的报告成为了工业改革中的一…”。先抓住并列的主干动作，再看修饰语补充的结果或影响。",
                "<span class=\"keyword\">句子骨架</span>：本句主干为 <span class=\"keyword\">the factory was shut down, and Cole's report became a landmark case</span>，由 and 连接两个并列分句，主语分别为 factory 和 Cole's report。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">was shut down</span> 使用被动语态（一般过去时），shut down（关闭）为固定的动副词组，主语 factory 是动作的承受者。",
                "<span class=\"keyword\">语境搭配</span>：本段虽没有新增词卡，仍可把 “the factory was shut down, and Cole's report became a landmark case”、“was shut down” 作为完整词块积累；回到原句观察它们承担的句法作用和前后搭配。"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "id": "set7",
    "number": 7,
    "label": "第七份",
    "columns": [
      {
        "id": "s7col1",
        "number": 1,
        "audio": {
          "src": "audio/list7_col1.mp3",
          "cues": [[1.64,1.76],[1.76,1.94],[1.94,2.18],[2.18,2.44],[2.44,2.86],[2.86,3],[3,3.32],[3.32,3.56],[3.56,3.94],[3.94,4.16],[4.16,4.42],[4.42,4.76],[4.76,5.26],[5.26,5.6],[5.6,5.72],[5.72,6.02],[6.86,7],[7,7.24],[7.72,7.82],[7.82,8.06],[8.06,8.26],[8.26,8.78],[8.78,8.82],[8.82,9.02],[9.02,9.46],[9.46,9.78],[9.78,10.14],[10.14,10.72],[10.72,11.14],[11.14,11.36],[11.36,11.88],[11.88,12.12],[12.12,12.34],[13.02,13.12],[13.12,13.56],[13.56,13.74],[13.74,13.9],[13.9,14.38],[14.38,14.78],[14.78,15.12],[15.12,15.42],[15.42,15.58],[15.58,15.78],[15.78,16.1],[16.1,16.68],[17.14,17.44],[17.44,17.7],[17.7,18.08],[18.08,18.4],[18.4,18.66],[18.66,19.08],[19.08,19.32],[19.32,19.62],[19.62,20.1],[20.1,20.58],[21.64,21.7],[21.7,21.96],[21.96,21.99],[21.99,22.26],[22.26,22.78],[22.78,23.16],[23.16,23.38],[23.38,23.82],[23.82,24.72],[24.72,24.75],[24.75,25.06],[25.06,25.36],[25.36,25.68],[25.68,25.82],[25.82,26.04],[26.04,26.38],null,[26.94,27.18],[27.18,27.48],[27.48,27.58],[27.58,27.9],[27.9,28.4],[28.4,28.62],[28.62,29.32],[29.32,29.44],[29.44,29.78],[29.78,30.26],[30.26,30.72],[31.18,31.24],[31.24,31.36],[31.36,31.6],[31.6,31.88],null,[32.98,33.08],[33.08,33.36],[33.36,33.7],[33.7,34.16],[34.16,34.2],[34.2,34.42],[34.42,35.68],null,[35.68,35.72],[35.72,36.04],[36.04,36.48],[36.48,36.94],[36.94,37.18],[37.18,37.48],[37.48,38.14],[38.14,38.56],[38.56,39.18],[39.18,39.44],[39.44,39.52],[39.52,39.8],[39.8,40.24],[41.12,41.24],[41.24,41.46],[41.46,41.84],[41.84,42.04],[42.04,42.32],[42.32,42.7],[42.7,42.92],[42.92,43.32],[43.32,43.82],[44.32,44.42],[44.42,44.52],[44.52,44.76],[44.76,45.1],[45.1,45.54],[45.54,45.98],[45.98,46.28],[46.28,46.68],[46.68,47.18],[47.18,47.36],[47.36,47.52],[47.52,47.82],[47.82,48.1],[48.9,49.06],[49.06,49.26],[49.26,49.56],[49.56,49.72],[49.72,50.08],[50.08,50.3],[50.3,50.76],[50.76,50.88],[50.88,51.18],[51.6,51.8],[51.8,51.92],[51.92,52.14],[52.14,52.36],[52.36,52.64],[52.64,52.98],[52.98,53.2],[53.2,53.44],[53.44,53.74],[53.74,54.08],[54.08,54.5],[54.5,54.88],[54.88,55],[55,55.44],[55.44,55.7],[55.7,56.28],[56.94,57.26],[57.26,57.74],[57.74,58.08],[58.08,58.42],[58.42,58.7],[58.7,59.02],[59.02,59.26],[60.18,60.42],[60.42,60.76],[60.76,61.1],[61.1,61.42],[61.42,61.94],[61.94,62.42],[62.42,62.94],[62.94,63.38],[63.38,63.5],[63.5,63.58],[63.58,63.84],[63.84,64.06],[64.06,64.5],[64.5,64.76],[65.28,65.42],[65.42,65.84],[65.84,66.06],[66.06,66.4],[66.4,66.84],[66.84,67.14],[67.14,67.38],[67.38,67.54],[67.54,67.78],null,[68.72,68.8],[68.8,69.06],[69.06,69.54],[69.54,69.74],[69.74,70.12],[70.12,70.24],[70.24,70.5],[70.5,71.02],[71.02,71.54],[71.54,71.72],[71.72,72.32],[72.58,72.88],[72.88,73.18],[73.18,73.58],[73.58,73.86],[73.86,74.5],[74.5,75.24],[76.02,76.2],[76.2,76.36],[76.36,76.6],[76.6,77.1],[77.1,77.48],[77.48,77.76],[77.76,78.1],[78.1,78.34],[78.34,78.6],[78.6,78.82],[79.74,79.88],[79.88,80.1],[80.1,80.64],[80.64,80.78],[80.78,80.98],[80.98,81.53],[81.53,81.58],[81.58,81.98],[81.98,82.22],[82.22,82.58],[82.58,83.26],[83.26,83.42],[83.42,83.68],[83.68,84.02],[84.56,84.86],[84.86,85.16],[85.16,85.44],[85.44,85.86],[85.86,86.08],[86.08,86.34],[86.34,86.6],[86.6,87.1],[87.1,87.36],[87.36,87.56],[87.56,87.96],[89,89.08],[89.08,89.32],[89.32,89.66],[89.66,89.76],[89.76,90.1],[90.1,90.54],[90.54,90.8],[90.8,91.04],[91.04,91.24],[91.24,91.66],[92.22,92.3],[92.3,92.4],[92.4,92.64],[92.64,93.1],[93.1,93.5],[93.5,94.04],[94.04,94.38],[95.34,95.44],[95.44,95.76],[95.76,96.06],[96.06,96.32],[96.32,96.72],[96.72,97.12],[97.12,97.32],[97.32,97.86],[97.86,98.1],[98.1,98.42],[98.42,98.8],[98.8,99.18],[99.18,99.23],[99.23,99.48],[99.48,99.94],[100.82,101.02],[101.02,101.3],[101.3,101.64],[101.64,101.86],[101.86,102.16],[102.16,102.5],[102.5,102.94],[102.94,103.56],[103.56,103.9],[103.9,104.26],[104.26,104.44],[105.12,105.28],[105.28,105.6],[105.6,106],[106,106.34],[106.34,106.8],[106.8,106.98],[106.98,107.42],[107.42,107.7],[107.7,107.98],[108.4,108.78],[108.78,109.1],[109.1,109.5],[109.5,109.82],[109.82,110.1],[110.1,110.4],[111.14,111.42],[111.42,111.86],[111.86,112.06],[112.06,112.38],[112.38,112.7],[112.7,113.02],[113.02,113.28],[113.28,113.72],[113.72,114.3],[114.3,114.98],[115.64,115.66],[115.66,115.94],[115.94,116.22],[116.22,116.64],[116.64,116.67],[116.67,116.9],[116.9,117.16],[117.16,117.42],[117.42,117.68],[117.68,118],[118.84,118.9],[118.9,119.12],[119.12,119.38],[119.38,119.64],[119.64,119.9],[119.9,120.2],[120.2,120.42],[120.42,120.5],[120.5,120.74],[120.74,121.04],[121.04,121.32],[122.18,122.54],[122.54,122.78],[122.78,123],[123,123.22],[123.22,123.7],[123.7,123.9],[123.9,124],[124,124.22],[124.22,124.52],[124.52,124.84],[125.36,125.42],[125.42,125.52],[125.52,125.66],[125.66,125.94],[125.94,126.3],[126.3,126.72],[126.72,127.38],[127.38,127.98],[127.98,128.01],[128.01,128.26],[128.26,128.72],[128.72,129.12],[129.12,129.32],[129.32,129.7],[129.7,129.92],[129.92,130.3]]
        },
        "title": "第一列",
        "theme": {
          "zh": "民众运动",
          "en": "People's Movement"
        },
        "words": [
          {
            "id": "s7col1-premature",
            "word": "premature",
            "pos": "adj.",
            "meaning": "过早的；提前的"
          },
          {
            "id": "s7col1-dissolve",
            "word": "dissolve",
            "pos": "v.",
            "meaning": "解散；溶解"
          },
          {
            "id": "s7col1-cripple",
            "word": "cripple",
            "pos": "v.",
            "meaning": "使瘫痪；严重削弱"
          },
          {
            "id": "s7col1-ascend",
            "word": "ascend",
            "pos": "v.",
            "meaning": "攀登；上升"
          },
          {
            "id": "s7col1-offset",
            "word": "offset",
            "pos": "v.",
            "meaning": "抵消；补偿"
          },
          {
            "id": "s7col1-malpractice",
            "word": "malpractice",
            "pos": "n.",
            "meaning": "渎职；玩忽职守"
          },
          {
            "id": "s7col1-reassure",
            "word": "reassure",
            "pos": "v.",
            "meaning": "使安心；再保证"
          },
          {
            "id": "s7col1-rebellion",
            "word": "rebellion",
            "pos": "n.",
            "meaning": "叛变；反抗"
          },
          {
            "id": "s7col1-lofty",
            "word": "lofty",
            "pos": "adj.",
            "meaning": "崇高的；高耸的"
          },
          {
            "id": "s7col1-conformity",
            "word": "conformity",
            "pos": "n.",
            "meaning": "顺从；一致"
          },
          {
            "id": "s7col1-landmark",
            "word": "landmark",
            "pos": "n.",
            "meaning": "地标；里程碑"
          },
          {
            "id": "s7col1-compartment",
            "word": "compartment",
            "pos": "n.",
            "meaning": "隔间；车厢"
          },
          {
            "id": "s7col1-rigid",
            "word": "rigid",
            "pos": "adj.",
            "meaning": "僵硬的；严格的"
          },
          {
            "id": "s7col1-sanction",
            "word": "sanction",
            "pos": "n.",
            "meaning": "制裁；批准"
          },
          {
            "id": "s7col1-artery",
            "word": "artery",
            "pos": "n.",
            "meaning": "动脉；干线"
          },
          {
            "id": "s7col1-recurring",
            "word": "recurring",
            "pos": "adj.",
            "meaning": "反复出现的"
          },
          {
            "id": "s7col1-overturn",
            "word": "overturn",
            "pos": "v.",
            "meaning": "推翻；倾覆"
          },
          {
            "id": "s7col1-escort",
            "word": "escort",
            "pos": "v.",
            "meaning": "护送；陪同"
          },
          {
            "id": "s7col1-monotony",
            "word": "monotony",
            "pos": "n.",
            "meaning": "单调；乏味"
          },
          {
            "id": "s7col1-smuggle",
            "word": "smuggle",
            "pos": "v.",
            "meaning": "走私；偷运"
          },
          {
            "id": "s7col1-rhetoric",
            "word": "rhetoric",
            "pos": "n.",
            "meaning": "修辞；华而不实的言语"
          },
          {
            "id": "s7col1-reconcile",
            "word": "reconcile",
            "pos": "v.",
            "meaning": "和解；调和"
          },
          {
            "id": "s7col1-slaughter",
            "word": "slaughter",
            "pos": "n.",
            "meaning": "大量杀戮"
          },
          {
            "id": "s7col1-console",
            "word": "console",
            "pos": "v.",
            "meaning": "安慰；慰藉"
          },
          {
            "id": "s7col1-hinge",
            "word": "hinge",
            "pos": "v.",
            "meaning": "取决于；铰链"
          },
          {
            "id": "s7col1-tangled",
            "word": "tangled",
            "pos": "adj.",
            "meaning": "纠缠的；混乱的"
          },
          {
            "id": "s7col1-imbibe",
            "word": "imbibe",
            "pos": "v.",
            "meaning": "吸收；饮（酒）"
          },
          {
            "id": "s7col1-inhibit",
            "word": "inhibit",
            "pos": "v.",
            "meaning": "抑制；阻碍"
          },
          {
            "id": "s7col1-linger",
            "word": "linger",
            "pos": "v.",
            "meaning": "逗留；徘徊"
          },
          {
            "id": "s7col1-grind",
            "word": "grind",
            "pos": "v.",
            "meaning": "磨碎；苦干"
          },
          {
            "id": "s7col1-huddle",
            "word": "huddle",
            "pos": "v.",
            "meaning": "挤作一团；蜷缩"
          },
          {
            "id": "s7col1-withhold",
            "word": "withhold",
            "pos": "v.",
            "meaning": "扣留；拒绝给予"
          },
          {
            "id": "s7col1-forfeit",
            "word": "forfeit",
            "pos": "v.",
            "meaning": "丧失；没收"
          }
        ],
        "paragraphs": [
          {
            "id": "s7col1-p1",
            "segments": [
              "The seeds of ",
              {
                "vocabId": "s7col1-rebellion",
                "text": "rebellion"
              },
              " had been sown long before the first shots echoed through the capital. For decades, the people had endured a ",
              {
                "vocabId": "s7col1-rigid",
                "text": "rigid"
              },
              " regime that demanded ",
              {
                "vocabId": "s7col1-conformity",
                "text": "conformity"
              },
              " in every aspect of life. The ",
              {
                "vocabId": "s7col1-monotony",
                "text": "monotony"
              },
              " of daily existence wore down even the most patient citizens, until the collective ",
              {
                "vocabId": "s7col1-grind",
                "text": "grind"
              },
              " of poverty and oppression became unbearable. It was a ",
              {
                "vocabId": "s7col1-recurring",
                "text": "recurring"
              },
              " pattern throughout the nation's history: a government drunk on its own ",
              {
                "vocabId": "s7col1-rhetoric",
                "text": "rhetoric"
              },
              ", blind to the suffering beneath it."
            ],
            "analysis": {
              "translation": "早在第一声枪响回荡于首都之前，叛乱的种子就已经播下了。数十年来，人民忍受着一个在生活各方面都要求顺从的僵化政权。日常生活的单调乏味磨损着即便最有耐心的公民，直到贫困与压迫的共同折磨变得无法忍受。这是这个国家历史中反复出现的模式：一个沉醉于自身辞令、对脚下苦难视而不见的政府。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “早在第一声枪响回荡于首都之前，叛乱的种子就已经播下…” → “日常生活的单调乏味磨损着即便最有耐心的公民，直到贫…” → “这是这个国家历史中反复出现的模式：一个沉醉于自身辞…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The seeds of rebellion had been sown</span>，使用过去完成时的被动语态，<span class=\"keyword\">long before the first shots echoed through the capital</span> 为时间状语从句。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">the people had endured a rigid regime</span>，<span class=\"keyword\">For decades</span> 为时间状语，<span class=\"keyword\">that demanded conformity in every aspect of life</span> 为定语从句修饰 regime。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">The monotony of daily existence wore down even the most patient citizens</span>，<span class=\"keyword\">until the collective grind of poverty and oppression became unbearable</span> 为时间状语从句，wear down（磨损）为固定搭配。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">the collective grind of poverty and oppression</span> 中 grind 此处作名词意为“折磨”，of 连接的两个名词作定语。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">It was a recurring pattern throughout the nation's history</span>，冒号后 <span class=\"keyword\">a government drunk on its own rhetoric, blind to the suffering beneath it</span> 为 pattern 的同位说明。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">drunk on its own rhetoric</span> 和 <span class=\"keyword\">blind to the suffering beneath it</span> 均为形容词短语作后置定语修饰 government，be drunk on（沉醉于）、be blind to（对……视而不见）均为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：rebellion 出现在“seeds of rebellion had been sown”中，本段取“叛变”义；rigid 出现在“endured a rigid regime that demanded”中，本段取“僵硬的”义；conformity 出现在“that demanded conformity in every aspect”中，本段取“顺从”义；monotony 出现在“The monotony of daily existence”中，本段取“单调”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col1-p2",
            "segments": [
              "When the uprising finally came, it was not ",
              {
                "vocabId": "s7col1-premature",
                "text": "premature"
              },
              ". The timing rested on a single catalyst — a ",
              {
                "vocabId": "s7col1-landmark",
                "text": "landmark"
              },
              " court ruling that exposed decades of ",
              {
                "vocabId": "s7col1-malpractice",
                "text": "malpractice"
              },
              " at the highest levels. The verdict threatened to ",
              {
                "vocabId": "s7col1-overturn",
                "text": "overturn"
              },
              " the entire power structure, and the ruling elite scrambled to ",
              {
                "vocabId": "s7col1-dissolve",
                "text": "dissolve"
              },
              " parliament before the news could spread. They attempted to ",
              {
                "vocabId": "s7col1-withhold",
                "text": "withhold"
              },
              " the information from the public, but the truth had already begun to flow through every ",
              {
                "vocabId": "s7col1-artery",
                "text": "artery"
              },
              " of the nation's communication network."
            ],
            "analysis": {
              "translation": "当起义最终到来时，它并非为时过早。时机取决于一个单一的催化剂——一项具有里程碑意义的法庭裁决，它揭露了最高层数十年来的渎职行为。这项判决威胁要颠覆整个权力结构，统治精英们争先恐后地在消息传开之前解散议会。他们试图向公众封锁这一信息，但真相已经开始通过国家通信网络的每一条动脉流淌。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “当起义最终到来时，它并非为时过早” → “这项判决威胁要颠覆整个权力结构，统治精英们争先恐后…” → “他们试图向公众封锁这一信息，但真相已经开始通过国家…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">it was not premature</span>，<span class=\"keyword\">When the uprising finally came</span> 为时间状语从句，premature 意为“过早的”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The timing rested on a single catalyst</span>，rest on（取决于）为固定搭配，破折号后 a landmark court ruling 为 catalyst 的同位语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that exposed decades of malpractice at the highest levels</span> 为定语从句修饰 ruling，malpractice 意为“渎职”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">逻辑衔接</span>：第三句由 and 连接两个并列分句：<span class=\"keyword\">The verdict threatened to overturn the entire power structure</span> 和 <span class=\"keyword\">the ruling elite scrambled to dissolve parliament before the news could spread</span>。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">before the news could spread</span> 为时间状语从句，scramble to do（争先恐后地做）为固定搭配。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">地道表达</span>：末句由 but 连接两个转折分句：<span class=\"keyword\">They attempted to withhold the information from the public</span> 和 <span class=\"keyword\">the truth had already begun to flow through every artery of the nation's communication network</span>，withhold...from...（对……封锁……）为固定搭配，artery 为比喻用法。",
                "<span class=\"keyword\">语境搭配</span>：premature 出现在“was not premature”中，本段取“过早的”义；landmark 出现在“a landmark court ruling that”中，本段取“地标”义；malpractice 出现在“decades of malpractice at the highest”中，本段取“渎职”义；overturn 出现在“threatened to overturn the entire power”中，本段取“推翻”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col1-p3",
            "segments": [
              "The regime's response was swift and brutal. Soldiers were ordered to ",
              {
                "vocabId": "s7col1-escort",
                "text": "escort"
              },
              " opposition leaders out of the city under armed guard, and anyone who resisted faced the threat of ",
              {
                "vocabId": "s7col1-slaughter",
                "text": "slaughter"
              },
              ". The military tried to ",
              {
                "vocabId": "s7col1-cripple",
                "text": "cripple"
              },
              " the resistance by severing supply lines, hoping to ",
              {
                "vocabId": "s7col1-inhibit",
                "text": "inhibit"
              },
              " any organized counterattack. Yet the rebels refused to ",
              {
                "vocabId": "s7col1-forfeit",
                "text": "forfeit"
              },
              " their dream of freedom. In dark cellars and hidden ",
              {
                "vocabId": "s7col1-compartment",
                "text": "compartment"
              },
              "s beneath old houses, they would ",
              {
                "vocabId": "s7col1-huddle",
                "text": "huddle"
              },
              " together, ",
              {
                "vocabId": "s7col1-imbibe",
                "text": "imbibe"
              },
              " whatever courage they could from shared stories and whispered plans."
            ],
            "analysis": {
              "translation": "政权的回应迅速而残暴。士兵们奉命在武装押送下将反对派领导人押送出城，任何反抗的人都面临被屠杀的威胁。军方试图通过切断补给线来削弱抵抗力量，希望以此阻止任何有组织的反攻。然而叛军拒绝放弃自由的梦想。在老旧房屋下方的黑暗地窖和隐藏隔间里，他们挤作一团，从共同的故事和低声的计划中汲取他们所能汲取的任何勇气。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “政权的回应迅速而残暴” → “军方试图通过切断补给线来削弱抵抗力量，希望以此阻止…” → “在老旧房屋下方的黑暗地窖和隐藏隔间里，他们挤作一团…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The regime's response was swift and brutal</span>，主系表结构，swift and brutal 为并列表语。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">Soldiers were ordered to escort opposition leaders out of the city under armed guard</span>，使用被动语态，be ordered to do（奉命做），<span class=\"keyword\">under armed guard</span> 为方式状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">and anyone who resisted faced the threat of slaughter</span> 为并列分句，<span class=\"keyword\">who resisted</span> 为定语从句修饰 anyone。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">The military tried to cripple the resistance by severing supply lines</span>，<span class=\"keyword\">by severing supply lines</span> 为方式状语，<span class=\"keyword\">hoping to inhibit any organized counterattack</span> 为现在分词短语作伴随状语。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">the rebels refused to forfeit their dream of freedom</span>，refuse to do（拒绝做），forfeit 意为“放弃”，Yet 表转折。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">they would huddle together</span>，<span class=\"keyword\">In dark cellars and hidden compartments beneath old houses</span> 为地点状语，<span class=\"keyword\">imbibe whatever courage they could from shared stories and whispered plans</span> 为动词不定式/并列谓语，imbibe...from...（从……汲取……）。",
                "<span class=\"keyword\">语境搭配</span>：escort 出现在“ordered to escort opposition leaders out”中，本段取“护送”义；slaughter 出现在“threat of slaughter”中，本段取“大量杀戮”义；cripple 出现在“tried to cripple the resistance by”中，本段取“使瘫痪”义；inhibit 出现在“hoping to inhibit any organized counterattack”中，本段取“抑制”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col1-p4",
            "segments": [
              "The success of the revolution would ",
              {
                "vocabId": "s7col1-hinge",
                "text": "hinge"
              },
              " on one question: could the rival factions ",
              {
                "vocabId": "s7col1-reconcile",
                "text": "reconcile"
              },
              " their differences? The ",
              {
                "vocabId": "s7col1-tangled",
                "text": "tangled"
              },
              " web of alliances and old grudges made unity seem like a ",
              {
                "vocabId": "s7col1-lofty",
                "text": "lofty"
              },
              " ideal. Some leaders tried to ",
              {
                "vocabId": "s7col1-offset",
                "text": "offset"
              },
              " past grievances with promises of reform, while others continued to ",
              {
                "vocabId": "s7col1-smuggle",
                "text": "smuggle"
              },
              " weapons across the border, defying every ",
              {
                "vocabId": "s7col1-sanction",
                "text": "sanction"
              },
              " the regime imposed."
            ],
            "analysis": {
              "translation": "革命的成功将取决于一个问题：敌对的派系能否和解它们的分歧？错综复杂的联盟与旧日恩怨构成的网络使团结看起来像一个崇高的理想。一些领导人试图用改革的承诺来抵消过去的怨恨，而另一些人则继续越过边境走私武器，公然违抗政权施加的每一项制裁。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “革命的成功将取决于一个问题：敌对的派系能否和解它们…” → “错综复杂的联盟与旧日恩怨构成的网络使团结看起来像一…” → “一些领导人试图用改革的承诺来抵消过去的怨恨，而另一…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The success of the revolution would hinge on one question</span>，hinge on（取决于）为固定搭配，冒号后 <span class=\"keyword\">could the rival factions reconcile their differences</span> 为 question 的同位说明。",
                "<span class=\"keyword\">地道表达</span>：<span class=\"keyword\">reconcile their differences</span> 为固定搭配，reconcile 意为“调和、和解”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The tangled web of alliances and old grudges made unity seem like a lofty ideal</span>，make sb./sth. do/seem 结构中 seem like 为不带 to 的不定式作宾补，<span class=\"keyword\">of alliances and old grudges</span> 为后置定语修饰 web。",
                "<span class=\"keyword\">地道表达</span>：第三句由 while 连接两个对比分句：<span class=\"keyword\">Some leaders tried to offset past grievances with promises of reform</span> 和 <span class=\"keyword\">others continued to smuggle weapons across the border</span>，offset...with...（用……抵消……）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">defying every sanction the regime imposed</span> 为现在分词短语作伴随状语，<span class=\"keyword\">the regime imposed</span> 为省略 that 的定语从句修饰 sanction。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">语境搭配</span>：hinge 出现在“revolution would hinge on one question”中，本段取“取决于”义；reconcile 出现在“rival factions reconcile their differences”中，本段取“和解”义；tangled 出现在“The tangled web of alliances”中，本段取“纠缠的”义；lofty 出现在“like a lofty ideal”中，本段取“崇高的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col1-p5",
            "segments": [
              "As the old order began to ",
              {
                "vocabId": "s7col1-ascend",
                "text": "ascend"
              },
              " toward irreversible collapse, the people watched with a mixture of hope and fear. The smell of smoke would ",
              {
                "vocabId": "s7col1-linger",
                "text": "linger"
              },
              " in the streets for weeks. Neighbors tried to ",
              {
                "vocabId": "s7col1-console",
                "text": "console"
              },
              " those who had lost loved ones, and the new leaders worked tirelessly to ",
              {
                "vocabId": "s7col1-reassure",
                "text": "reassure"
              },
              " a frightened populace that better days lay ahead."
            ],
            "analysis": {
              "translation": "随着旧秩序开始走向不可逆转的崩溃，人民怀着希望与恐惧交织的心情注视着。硝烟的气味将在街道上弥漫数周。邻居们试图安慰那些失去亲人的人，而新领导人不知疲倦地工作，以让惊恐的民众安心：更好的日子就在前方。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “旧秩序开始走向不可逆转的崩溃，人民怀着希望与恐惧交…” → “硝烟的气味将在街道上弥漫数周” → “邻居们试图安慰那些失去亲人的人，而新领导人不知疲倦…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">the people watched with a mixture of hope and fear</span>，<span class=\"keyword\">As the old order began to ascend toward irreversible collapse</span> 为时间状语从句，ascend toward（走向）为固定搭配，a mixture of（……的交织）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The smell of smoke would linger in the streets for weeks</span>，would 表过去将来时，linger（弥漫、徘徊）为不及物动词，for weeks 为持续时间状语。",
                "<span class=\"keyword\">逻辑衔接</span>：第三句由 and 连接两个并列分句：<span class=\"keyword\">Neighbors tried to console those who had lost loved ones</span> 和 <span class=\"keyword\">the new leaders worked tirelessly to reassure a frightened populace that better days lay ahead</span>。并列或转折标志划分了信息层级，后半部分往往补充、修正或反衬前半部分。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">who had lost loved ones</span> 为定语从句修饰 those，console sb.（安慰某人）为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">to reassure a frightened populace that better days lay ahead</span> 为动词不定式作目的状语，reassure sb. that...（使某人安心）中 that 引导宾语从句，lay ahead（在前方）为固定搭配。这个从句承载的是完整内容；先判断它在主句中充当什么成分，再分析从句内部。",
                "<span class=\"keyword\">语境搭配</span>：ascend 出现在“began to ascend toward irreversible collapse”中，本段取“攀登”义；linger 出现在“smoke would linger in the streets”中，本段取“逗留”义；console 出现在“tried to console those who had”中，本段取“安慰”义；reassure 出现在“tirelessly to reassure a frightened populace”中，本段取“使安心”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s7col2",
        "number": 2,
        "audio": {
          "src": "audio/list7_col2.mp3",
          "cues": [[2.44,2.72],[2.72,3.28],[3.28,3.6],[3.6,3.78],[3.78,4.08],[4.08,4.48],[4.48,4.6],[4.6,5.42],[5.42,5.47],[5.47,5.62],[5.62,5.86],[5.86,6.24],[6.24,6.74],[6.74,6.9],[6.9,7.1],[7.1,7.18],[7.18,7.56],[7.56,7.84],[7.84,8.06],[8.06,8.34],[8.34,8.78],[8.78,9.16],[9.16,9.54],[9.54,9.82],[9.82,10.24],[11.16,11.3],[11.3,11.42],[11.42,11.52],[11.52,11.84],[11.84,12.3],[12.3,12.54],[12.54,12.78],[12.78,12.98],[12.98,13.14],[13.14,13.32],[13.32,13.8],[13.8,13.98],[14.56,14.9],[14.9,15.06],[15.06,15.22],[15.22,15.42],[15.42,15.66],[15.66,16.86],[16.86,16.91],[16.91,17.24],[17.24,17.56],[17.56,17.92],[17.92,18.06],[18.06,18.36],[18.36,18.72],[18.72,19],[19,19.14],[19.14,19.44],null,[19.82,19.94],[19.94,20.14],[20.14,20.3],[20.3,20.5],[20.5,20.86],[20.86,21],[21,21.62],[21.62,21.68],[21.68,22.02],[22.02,22.28],[22.28,22.76],[22.76,22.92],[22.92,23.12],[23.12,23.56],[24.62,24.86],[24.86,25.08],[25.08,25.48],[25.48,26.16],[26.16,26.19],[26.19,26.52],[26.52,27],[27,27.22],[27.22,27.86],[28.42,28.72],[28.72,28.98],[28.98,29.08],[29.08,29.56],[29.56,29.76],[29.76,29.98],[29.98,30.26],[30.26,30.54],[30.54,30.82],[30.82,31.34],[31.34,31.86],[31.86,31.89],[31.89,32.2],[32.2,32.68],[32.68,33.12],[33.12,33.48],[33.48,33.84],[33.84,34.08],[34.08,34.22],[34.22,34.46],[35.2,35.4],[35.4,35.86],[35.86,36.04],[36.04,36.22],[36.22,36.68],[36.68,36.92],[36.92,37.32],[37.32,37.54],[37.54,37.82],[38.42,38.48],[38.48,38.62],[38.62,38.82],[38.82,39.26],[39.26,39.68],[39.68,39.9],[39.9,40.28],[40.28,40.56],[40.56,40.68],[40.68,41.22],[41.22,41.7],[41.7,41.82],[41.82,42.14],[42.14,42.54],[42.54,42.84],[42.84,43.06],[43.06,43.34],[43.34,43.82],[44.72,44.98],[44.98,45.5],[45.5,45.54],[45.54,45.74],[45.74,45.94],[45.94,46.6],[46.98,47.16],[47.16,47.46],[47.46,47.76],[47.76,48.2],[48.2,48.32],[48.32,48.56],[48.56,48.8],[48.8,49.1],[49.1,49.34],[49.34,50.66],[50.66,50.7],[50.7,50.94],[50.94,51.42],[51.42,52.04],[52.04,52.54],[52.54,52.59],[52.59,52.78],[52.78,53.04],[53.04,53.5],[53.5,53.9],[53.9,54.18],[54.18,54.4],[54.4,54.64],[54.64,54.9],[54.9,55.22],[55.22,55.62],[56.42,56.5],[56.5,56.7],[56.7,57.14],[57.14,57.58],[57.58,57.64],[57.64,57.82],[57.82,57.98],[57.98,58.06],[58.06,58.3],[58.3,58.48],[58.48,58.82],[58.82,59.2],[60.04,60.3],[60.3,60.8],[61.18,61.22],[61.22,61.42],[61.42,61.62],[61.62,62],[62,62.16],[62.16,62.46],[62.46,63.2],[63.2,63.56],[64.24,64.36],[64.36,64.56],[64.56,64.92],[64.92,65.12],[65.12,65.56],[65.56,65.9],[65.9,66.4],[66.4,66.78],[67.66,67.9],[67.9,68.06],[68.06,68.28],[68.28,68.76],[68.76,68.86],[68.86,69.44],[69.44,69.8],null,[70.7,70.82],[70.82,70.96],[70.96,71.16],[71.16,71.54],[71.54,71.86],[71.86,72.16],[72.16,72.44],[72.44,72.84],[72.84,73.1],[73.1,73.34],[73.34,73.74],[73.74,73.78],[73.78,74.04],[74.04,74.32],[74.96,75.18],[75.18,75.3],[75.3,75.48],[75.48,75.92],[75.92,76.06],[76.06,76.34],[76.34,76.98],[76.98,77.16],[77.16,77.46],[78.34,78.5],[78.5,78.66],[78.66,78.94],[78.94,79.26],null,[79.98,80.08],[80.08,81.24],[81.24,81.27],[81.27,81.6],[81.6,82.14],[82.14,82.4],[82.4,82.66],[82.66,83.24],[83.24,84.04],[84.04,84.08],[84.08,84.34],[84.34,84.58],[84.58,84.8],[84.8,85.1],[85.1,85.78],[85.78,85.96],[85.96,86.2],[87.04,87.18],[87.18,87.32],[87.32,87.88],[87.88,88.58],[88.74,89],[89,89.52],[89.52,89.78],[89.78,90.18],[90.18,90.42],[90.42,90.68],[91.36,91.66],[91.66,92.04],[92.04,92.07],[92.07,92.28],[92.28,92.7],[92.7,92.84],[92.84,93.3],[93.3,93.46],[93.46,93.68],[93.68,93.96],[94.94,95.06],[95.06,95.32],[95.32,95.54],[95.54,95.94],null,[97.16,97.32],[97.32,97.48],[97.48,97.92],[97.92,98.34],[98.34,98.54],[98.54,98.86],[98.86,99.3],[99.3,99.5],[99.5,99.7],[99.7,99.88],[99.88,100.2],[100.2,100.52],[101.52,101.62],[101.62,101.78],[101.78,102.08],[102.08,102.28],[102.28,102.66],[102.66,102.96],[102.96,103.16],[103.16,103.38],[103.38,103.68],[103.68,103.8],[103.8,104.08],[104.56,104.72],[104.72,104.92],[104.92,105.4],[105.4,105.62],[105.62,105.84],[105.84,106.18],[106.18,106.42],[106.42,106.76],[107.62,107.84],[107.84,108.1],[108.1,108.32],[108.32,108.62],[108.62,108.8],[108.8,109.16],[109.16,109.38],[109.94,110.1],[110.1,110.5],[110.5,110.76],[110.76,111.12],[111.12,111.54],[111.54,111.74],[111.74,111.88],[111.88,112.2],[113.04,113.42],[113.5,113.78],[113.9,114.16],[114.16,114.62],[114.62,114.72],[114.72,114.96],[114.96,115.32],[115.32,115.52],[115.52,115.82],[115.82,116.44],[117.18,117.28],[117.28,117.44],[117.44,117.58],[117.58,117.98],[117.98,118.48],[118.48,118.96],[118.96,119.3],[119.3,119.72],[119.72,120.14],[121.02,121.12],[121.12,121.46],[121.46,121.74],[121.74,122.02],[122.02,122.4],[123.28,123.48],[123.48,123.64],[123.64,123.78],[123.78,124.08],[124.08,124.45],[124.45,124.5],[124.5,125.18],[125.18,125.21],[125.21,125.36],[125.36,125.66],null,[126.26,126.36],[126.36,126.56],[126.56,127],[127,127.38],[127.38,127.54],[127.54,128.1],[128.1,128.48],[128.48,129.16],[129.16,129.6],null,[130.14,130.24],[130.24,130.44],[130.44,130.68],[130.68,131],[132.24,132.41],[132.41,132.58],[132.58,133.04],[133.04,133.32],[133.32,133.62],[133.62,134.22]]
        },
        "title": "第二列",
        "theme": {
          "zh": "侦探迷案调查",
          "en": "Detective's Mystery Investigation"
        },
        "words": [
          {
            "id": "s7col2-summon",
            "word": "summon",
            "pos": "v.",
            "meaning": "传唤；召唤"
          },
          {
            "id": "s7col2-strangle",
            "word": "strangle",
            "pos": "v.",
            "meaning": "勒死；扼杀"
          },
          {
            "id": "s7col2-counterfeit",
            "word": "counterfeit",
            "pos": "adj.",
            "meaning": "伪造的；假冒的"
          },
          {
            "id": "s7col2-endow",
            "word": "endow",
            "pos": "v.",
            "meaning": "赋予；资助"
          },
          {
            "id": "s7col2-reciprocal",
            "word": "reciprocal",
            "pos": "adj.",
            "meaning": "互惠的；相互的"
          },
          {
            "id": "s7col2-unveil",
            "word": "unveil",
            "pos": "v.",
            "meaning": "揭示；揭幕"
          },
          {
            "id": "s7col2-mediate",
            "word": "mediate",
            "pos": "v.",
            "meaning": "调解；斡旋"
          },
          {
            "id": "s7col2-deplore",
            "word": "deplore",
            "pos": "v.",
            "meaning": "谴责；强烈反对"
          },
          {
            "id": "s7col2-trauma",
            "word": "trauma",
            "pos": "n.",
            "meaning": "创伤；精神创伤"
          },
          {
            "id": "s7col2-invert",
            "word": "invert",
            "pos": "v.",
            "meaning": "倒置；反转"
          },
          {
            "id": "s7col2-ascribe",
            "word": "ascribe",
            "pos": "v.",
            "meaning": "归因于"
          },
          {
            "id": "s7col2-prototype",
            "word": "prototype",
            "pos": "n.",
            "meaning": "原型；雏形"
          },
          {
            "id": "s7col2-exempt",
            "word": "exempt",
            "pos": "adj.",
            "meaning": "免除的；豁免的"
          },
          {
            "id": "s7col2-brink",
            "word": "brink",
            "pos": "n.",
            "meaning": "边缘"
          },
          {
            "id": "s7col2-disperse",
            "word": "disperse",
            "pos": "v.",
            "meaning": "驱散；分散"
          },
          {
            "id": "s7col2-repress",
            "word": "repress",
            "pos": "v.",
            "meaning": "压制；抑制"
          },
          {
            "id": "s7col2-impetus",
            "word": "impetus",
            "pos": "n.",
            "meaning": "动力；推动力"
          },
          {
            "id": "s7col2-noteworthy",
            "word": "noteworthy",
            "pos": "adj.",
            "meaning": "值得注意的"
          },
          {
            "id": "s7col2-besiege",
            "word": "besiege",
            "pos": "v.",
            "meaning": "围困；包围"
          },
          {
            "id": "s7col2-devour",
            "word": "devour",
            "pos": "v.",
            "meaning": "吞食；毁灭"
          },
          {
            "id": "s7col2-retort",
            "word": "retort",
            "pos": "v.",
            "meaning": "反驳；回嘴"
          },
          {
            "id": "s7col2-intelligible",
            "word": "intelligible",
            "pos": "adj.",
            "meaning": "可理解的；明了的"
          },
          {
            "id": "s7col2-stumble",
            "word": "stumble",
            "pos": "v.",
            "meaning": "绊倒；踉跄"
          },
          {
            "id": "s7col2-rectify",
            "word": "rectify",
            "pos": "v.",
            "meaning": "纠正；修复"
          },
          {
            "id": "s7col2-reputed",
            "word": "reputed",
            "pos": "adj.",
            "meaning": "被认为的；有名的"
          },
          {
            "id": "s7col2-revolt",
            "word": "revolt",
            "pos": "n.",
            "meaning": "反叛；厌恶"
          },
          {
            "id": "s7col2-conspiracy",
            "word": "conspiracy",
            "pos": "n.",
            "meaning": "密谋；共谋"
          },
          {
            "id": "s7col2-contagious",
            "word": "contagious",
            "pos": "adj.",
            "meaning": "传染性的"
          },
          {
            "id": "s7col2-rehearse",
            "word": "rehearse",
            "pos": "v.",
            "meaning": "排练；预演"
          },
          {
            "id": "s7col2-groan",
            "word": "groan",
            "pos": "v.",
            "meaning": "呻吟；叹息"
          },
          {
            "id": "s7col2-eminent",
            "word": "eminent",
            "pos": "adj.",
            "meaning": "杰出的；显赫的"
          },
          {
            "id": "s7col2-denounce",
            "word": "denounce",
            "pos": "v.",
            "meaning": "谴责；告发"
          },
          {
            "id": "s7col2-negligent",
            "word": "negligent",
            "pos": "adj.",
            "meaning": "疏忽的；粗心大意的"
          },
          {
            "id": "s7col2-negligible",
            "word": "negligible",
            "pos": "adj.",
            "meaning": "微不足道的；可忽略的"
          },
          {
            "id": "s7col2-stagger",
            "word": "stagger",
            "pos": "v.",
            "meaning": "蹒跚；使震惊"
          }
        ],
        "paragraphs": [
          {
            "id": "s7col2-p1",
            "segments": [
              "Detective Harlan Voss was ",
              {
                "vocabId": "s7col2-eminent",
                "text": "eminent"
              },
              " in his field, a man whose reputation had been ",
              {
                "vocabId": "s7col2-endow",
                "text": "endow"
              },
              "ed by years of solving cases that baffled lesser minds. So when the commissioner decided to ",
              {
                "vocabId": "s7col2-summon",
                "text": "summon"
              },
              " him to headquarters at midnight, Voss knew the matter was grave. A ",
              {
                "vocabId": "s7col2-reputed",
                "text": "reputed"
              },
              " banker had been found dead in his study — the kind of crime that could ",
              {
                "vocabId": "s7col2-strangle",
                "text": "strangle"
              },
              " a city's confidence in its own institutions."
            ],
            "analysis": {
              "translation": "侦探哈兰·沃斯在他的领域声名显赫，他的声誉来自多年破解那些令平庸之辈困惑的案件。因此，当警长决定在午夜将他召到总部时，沃斯知道此事非同小可。一位声名显赫的银行家被发现死在自己的书房里——这种罪行足以扼杀一座城市对自身机构的信心。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “侦探哈兰·沃斯在他的领域声名显赫，他的声誉来自多年…” → “当警长决定在午夜将他召到总部时，沃斯知道此事非同小…” → “一位声名显赫的银行家被发现死在自己的书房里——这种…” 的顺序展开。阅读时沿着这一顺序追踪场景、动作与结果，就不会被长句中的修饰成分带偏。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Detective Harlan Voss was eminent in his field</span>，<span class=\"keyword\">a man whose reputation had been endowed by years of solving cases that baffled lesser minds</span> 为 Voss 的同位语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">whose reputation had been endowed by years of solving cases</span> 为定语从句修饰 man，endow 意为“赋予”，使用被动语态。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that baffled lesser minds</span> 为定语从句修饰 cases，baffle 意为“使困惑”，lesser minds 意为“平庸之辈”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">Voss knew the matter was grave</span>，So 置于句首表因果，<span class=\"keyword\">when the commissioner decided to summon him to headquarters at midnight</span> 为时间状语从句，knew 后接省略 that 的宾语从句。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">A reputed banker had been found dead in his study</span>，使用被动语态，dead 为主语补足语，<span class=\"keyword\">the kind of crime that could strangle a city's confidence in its own institutions</span> 为同位语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that could strangle a city's confidence in its own institutions</span> 为定语从句修饰 crime，strangle 意为“扼杀”，confidence in（对……的信心）为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：eminent 出现在“Voss was eminent in his field”中，本段取“杰出的”义；endow 出现在“had been endow”中，本段取“赋予”义；summon 出现在“decided to summon him to headquarters”中，本段取“传唤”义；reputed 出现在“A reputed banker had been”中，本段取“被认为的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col2-p2",
            "segments": [
              "The evidence pointed toward a ",
              {
                "vocabId": "s7col2-conspiracy",
                "text": "conspiracy"
              },
              " of remarkable scope. Hidden in the victim's safe were bundles of ",
              {
                "vocabId": "s7col2-counterfeit",
                "text": "counterfeit"
              },
              " currency and a ",
              {
                "vocabId": "s7col2-prototype",
                "text": "prototype"
              },
              " printing plate still warm from the press. Whoever killed the banker wanted to ",
              {
                "vocabId": "s7col2-repress",
                "text": "repress"
              },
              " the truth, but the murder itself became the ",
              {
                "vocabId": "s7col2-impetus",
                "text": "impetus"
              },
              " for an investigation that would ",
              {
                "vocabId": "s7col2-unveil",
                "text": "unveil"
              },
              " far more than anyone expected. Voss followed a trail of accomplices, each more ",
              {
                "vocabId": "s7col2-negligent",
                "text": "negligent"
              },
              " than the last in covering their tracks. A single ",
              {
                "vocabId": "s7col2-negligible",
                "text": "negligible"
              },
              " fingerprint on a wine glass proved enough to crack the case wide open."
            ],
            "analysis": {
              "translation": "证据指向一个规模惊人的阴谋。被害人的保险箱里藏着一捆捆假钞和一块刚从印刷机上取下还带着余温的印版原型。杀死银行家的人想要压制真相，但这起谋杀本身却成了一项调查的推动力，这项调查将揭开远超任何人预期的内幕。沃斯追踪了一连串同伙，每个人在掩盖痕迹方面都比上一个更疏忽。酒杯上一个微不足道的指纹就足以使案件豁然开朗。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “证据指向一个规模惊人的阴谋” → “杀死银行家的人想要压制真相，但这起谋杀本身却成了一…” → “酒杯上一个微不足道的指纹就足以使案件豁然开朗” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">The evidence pointed toward a conspiracy of remarkable scope</span>，point toward（指向）为固定搭配，of remarkable scope 为后置定语。",
                "<span class=\"keyword\">结构拆解</span>：第二句为倒装句 <span class=\"keyword\">Hidden in the victim's safe were bundles of counterfeit currency and a prototype printing plate still warm from the press</span>，过去分词 Hidden 置于句首表强调，真正主语为 bundles...and a prototype printing plate。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">still warm from the press</span> 为形容词短语作后置定语修饰 plate，warm from（刚从……取下还带余温）。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Whoever killed the banker wanted to repress the truth</span>，<span class=\"keyword\">Whoever killed the banker</span> 为主语从句，repress 意为“压制”。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">but the murder itself became the impetus for an investigation that would unveil far more than anyone expected</span> 为转折并列分句，<span class=\"keyword\">that would unveil far more than anyone expected</span> 为定语从句修饰 investigation，impetus for（……的推动力）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">Voss followed a trail of accomplices</span>，<span class=\"keyword\">each more negligent than the last in covering their tracks</span> 为独立主格结构作伴随状语。末句主干为 <span class=\"keyword\">A single negligible fingerprint on a wine glass proved enough to crack the case wide open</span>，<span class=\"keyword\">to crack the case wide open</span> 为动词不定式作结果状语/补语。",
                "<span class=\"keyword\">语境搭配</span>：conspiracy 出现在“toward a conspiracy of remarkable scope”中，本段取“密谋”义；counterfeit 出现在“bundles of counterfeit currency and a”中，本段取“伪造的”义；prototype 出现在“and a prototype printing plate still”中，本段取“原型”义；repress 出现在“wanted to repress the truth”中，本段取“压制”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col2-p3",
            "segments": [
              "His prime suspect was a man on the ",
              {
                "vocabId": "s7col2-brink",
                "text": "brink"
              },
              " of financial ruin. Under interrogation, the man would ",
              {
                "vocabId": "s7col2-retort",
                "text": "retort"
              },
              " with barely ",
              {
                "vocabId": "s7col2-intelligible",
                "text": "intelligible"
              },
              " excuses, then ",
              {
                "vocabId": "s7col2-groan",
                "text": "groan"
              },
              " as each alibi collapsed under scrutiny. Voss did not ",
              {
                "vocabId": "s7col2-deplore",
                "text": "deplore"
              },
              " the suspect's desperation — he had seen enough ",
              {
                "vocabId": "s7col2-trauma",
                "text": "trauma"
              },
              " to understand what ruin could drive a person to. But he refused to let sympathy ",
              {
                "vocabId": "s7col2-invert",
                "text": "invert"
              },
              " his judgment. The facts were ",
              {
                "vocabId": "s7col2-noteworthy",
                "text": "noteworthy"
              },
              ": three witnesses, a ",
              {
                "vocabId": "s7col2-reciprocal",
                "text": "reciprocal"
              },
              " exchange of encrypted messages, and a motive one could reasonably ",
              {
                "vocabId": "s7col2-ascribe",
                "text": "ascribe"
              },
              " to greed."
            ],
            "analysis": {
              "translation": "他的头号嫌疑犯是一个濒临财务破产的男人。在审讯中，这个人会用几乎听不懂的借口来反驳，然后在每一个不在场证明都在审查下崩溃时发出呻吟。沃斯并不惋惜嫌疑人的绝望——他见过了太多的创伤，懂得破产能把一个人逼到什么地步。但他拒绝让同情颠倒他的判断。事实值得注意：三名证人，一次加密信息的往来交换，以及一个可以合理归因于贪婪的动机。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “他的头号嫌疑犯是一个濒临财务破产的男人” → “沃斯并不惋惜嫌疑人的绝望——他见过了太多的创伤，懂…” → “事实值得注意：三名证人，一次加密信息的往来交换，以…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">His prime suspect was a man on the brink of financial ruin</span>，<span class=\"keyword\">on the brink of</span>（濒临）为固定搭配作后置定语修饰 man。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">the man would retort with barely intelligible excuses, then groan as each alibi collapsed under scrutiny</span>，would 表过去习惯，retort 和 groan 为并列谓语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">as each alibi collapsed under scrutiny</span> 为时间状语从句，under scrutiny（在审查下）为固定搭配，intelligible 意为“可理解的”。连接词或非谓语形式在这里标明时间、原因、让步或目的，是判断句间逻辑的关键。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Voss did not deplore the suspect's desperation</span>，deplore 意为“痛惜、谴责”，破折号后 <span class=\"keyword\">he had seen enough trauma to understand what ruin could drive a person to</span> 为原因说明，drive sb. to（把某人逼到……地步）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">he refused to let sympathy invert his judgment</span>，refuse to do（拒绝做），invert 意为“颠倒”，But 表转折。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">The facts were noteworthy</span>，冒号后 three witnesses, a reciprocal exchange of encrypted messages, and a motive one could reasonably ascribe to greed 为 facts 的同位列举，<span class=\"keyword\">one could reasonably ascribe to greed</span> 为省略 that 的定语从句修饰 motive，ascribe...to...（把……归因于……）为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：brink 出现在“on the brink of financial ruin”中，本段取“边缘”义；retort 出现在“man would retort with barely intelligible”中，本段取“反驳”义；intelligible 出现在“with barely intelligible excuses”中，本段取“可理解的”义；groan 出现在“then groan as each alibi”中，本段取“呻吟”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col2-p4",
            "segments": [
              "As the investigation deepened, reporters began to ",
              {
                "vocabId": "s7col2-besiege",
                "text": "besiege"
              },
              " the precinct, hungry for a scandal that would ",
              {
                "vocabId": "s7col2-devour",
                "text": "devour"
              },
              " the front pages. The panic was ",
              {
                "vocabId": "s7col2-contagious",
                "text": "contagious"
              },
              "; even veteran officers seemed to ",
              {
                "vocabId": "s7col2-stagger",
                "text": "stagger"
              },
              " beneath the weight of public scrutiny. The chief tried to ",
              {
                "vocabId": "s7col2-mediate",
                "text": "mediate"
              },
              " between the press and the department, but every effort to ",
              {
                "vocabId": "s7col2-disperse",
                "text": "disperse"
              },
              " the crowds failed. Critics were swift to ",
              {
                "vocabId": "s7col2-denounce",
                "text": "denounce"
              },
              " the force, and murmurs of ",
              {
                "vocabId": "s7col2-revolt",
                "text": "revolt"
              },
              " rippled through the streets."
            ],
            "analysis": {
              "translation": "随着调查的深入，记者们开始围攻警局，渴望着一个足以吞噬头版头条的丑闻。恐慌是会传染的；即便是老练的警官似乎也在公众审视的重压下踉跄。警长试图在媒体和警局之间斡旋，但每一次驱散人群的努力都失败了。批评者们迅速谴责警方，叛乱的低语在街头荡漾。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “调查的深入，记者们开始围攻警局，渴望着一个足以吞噬…” → “警长试图在媒体和警局之间斡旋，但每一次驱散人群的努…” → “批评者们迅速谴责警方，叛乱的低语在街头荡漾” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">reporters began to besiege the precinct</span>，<span class=\"keyword\">As the investigation deepened</span> 为时间状语从句，<span class=\"keyword\">hungry for a scandal that would devour the front pages</span> 为形容词短语作伴随状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that would devour the front pages</span> 为定语从句修饰 scandal，devour 意为“吞噬”，besiege 意为“围攻”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The panic was contagious</span>，分号后 <span class=\"keyword\">even veteran officers seemed to stagger beneath the weight of public scrutiny</span> 为并列分句，stagger beneath the weight of（在……的重压下踉跄）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">The chief tried to mediate between the press and the department</span>，mediate between（在……之间斡旋）为固定搭配，<span class=\"keyword\">but every effort to disperse the crowds failed</span> 为转折并列分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">to disperse the crowds</span> 为动词不定式作后置定语修饰 effort。",
                "<span class=\"keyword\">地道表达</span>：末句由 and 连接两个并列分句：<span class=\"keyword\">Critics were swift to denounce the force</span> 和 <span class=\"keyword\">murmurs of revolt rippled through the streets</span>，be swift to do（迅速做），denounce 意为“谴责”，ripple through（在……中荡漾）为固定搭配。",
                "<span class=\"keyword\">语境搭配</span>：besiege 出现在“began to besiege the precinct”中，本段取“围困”义；devour 出现在“that would devour the front pages”中，本段取“吞食”义；contagious 出现在“panic was contagious”中，本段取“传染性的”义；stagger 出现在“seemed to stagger beneath the weight”中，本段取“蹒跚”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col2-p5",
            "segments": [
              "Voss, however, would ",
              {
                "vocabId": "s7col2-rehearse",
                "text": "rehearse"
              },
              " his final move with meticulous care. He knew the mastermind believed himself ",
              {
                "vocabId": "s7col2-exempt",
                "text": "exempt"
              },
              " from consequence, shielded by wealth and influence. But when the detective ",
              {
                "vocabId": "s7col2-stumble",
                "text": "stumble"
              },
              "d upon a hidden ledger — the one document that could ",
              {
                "vocabId": "s7col2-rectify",
                "text": "rectify"
              },
              " every fabricated lie — the case was sealed. Justice, long delayed, had finally arrived."
            ],
            "analysis": {
              "translation": "然而，沃斯会以一丝不苟的谨慎来排演他的最后一步棋。他知道主谋认为自己可以免受后果，被财富和影响力所庇护。但当这位侦探偶然发现一本隐藏的账本——那份能够纠正每一个捏造谎言的唯一文件——案件便尘埃落定。正义虽迟，但终已到来。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “沃斯会以一丝不苟的谨慎来排演他的最后一步棋” → “当这位侦探偶然发现一本隐藏的账本——那份能够纠正每…” → “正义虽迟，但终已到来” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Voss would rehearse his final move with meticulous care</span>，would 表过去将来，<span class=\"keyword\">with meticulous care</span> 为方式状语，rehearse 意为“排演”，however 表转折。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">He knew the mastermind believed himself exempt from consequence</span>，knew 后接省略 that 的宾语从句，believe oneself...（认为自己……）中 exempt from consequence 为主语补足语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">exempt from</span>（免于）为固定搭配，<span class=\"keyword\">shielded by wealth and influence</span> 为过去分词短语作伴随状语。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">the case was sealed</span>，<span class=\"keyword\">when the detective stumbled upon a hidden ledger</span> 为时间状语从句，stumble upon（偶然发现）为固定搭配。",
                "<span class=\"keyword\">结构拆解</span>：破折号间 <span class=\"keyword\">the one document that could rectify every fabricated lie</span> 为 ledger 的同位语，<span class=\"keyword\">that could rectify every fabricated lie</span> 为定语从句修饰 document，rectify 意为“纠正”。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：末句 <span class=\"keyword\">Justice, long delayed, had finally arrived</span> 中 <span class=\"keyword\">long delayed</span> 为过去分词短语作插入语修饰 Justice，主干为 Justice had finally arrived。",
                "<span class=\"keyword\">语境搭配</span>：rehearse 出现在“would rehearse his final move”中，本段取“排练”义；exempt 出现在“believed himself exempt from consequence”中，本段取“免除的”义；stumble 出现在“the detective stumble”中，本段取“绊倒”义；rectify 出现在“that could rectify every fabricated lie”中，本段取“纠正”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      },
      {
        "id": "s7col3",
        "number": 3,
        "audio": {
          "src": "audio/list7_col3.mp3",
          "cues": [[2.3,2.48],[2.48,2.74],[2.74,2.98],[2.98,3.36],[3.36,3.86],[3.86,4.12],[4.12,4.4],[4.4,4.72],[4.72,5.22],[5.22,5.6],[5.8,6],[6,6.2],[6.2,6.52],[6.52,6.88],[6.88,7.2],[7.2,7.44],[7.44,7.88],[7.88,8.08],[8.08,8.36],[8.36,8.72],[9.44,9.68],[9.68,10.06],[10.44,10.78],[10.78,11.16],null,[11.34,11.42],[11.42,11.7],[11.7,11.94],[11.94,12.36],[12.36,12.78],[12.78,13.06],[13.06,13.44],[13.44,13.76],[13.76,14.1],[14.1,14.44],[14.44,14.7],[14.7,15.1],[15.1,15.4],[15.4,15.84],[15.84,16.12],[16.12,16.56],[16.56,16.98],[16.98,17.34],[18,18.28],[18.28,18.68],[18.68,19.14],[19.14,19.52],[19.52,19.86],[19.86,20.28],[20.28,20.68],[20.68,21],[21,21.38],[21.38,22.14],[22.68,22.96],[22.96,23.24],[23.24,23.5],[23.5,23.74],[23.74,24.14],[24.14,24.5],[24.5,24.74],[24.74,25.1],[25.1,25.56],[25.56,25.92],[25.92,26.24],[26.24,26.78],[26.78,27.18],[27.18,27.96],[27.96,28.66],[28.66,28.92],[28.92,29.14],[29.14,29.6],[29.6,29.88],[29.88,30.36],[30.36,30.58],[30.58,30.96],[30.96,31.66],[32.06,32.26],[32.26,32.66],[32.66,33],[33,33.38],[33.38,33.94],[33.94,34.52],[34.52,34.8],[34.8,35.06],[35.06,35.66],[35.66,35.98],[35.98,36.3],[36.94,37.1],[37.1,37.4],[37.4,37.64],[38.02,38.08],[38.08,38.54],[38.54,38.84],[38.84,39.4],[39.4,39.62],[39.62,39.82],[39.82,40.1],[40.1,40.3],[40.3,40.48],[40.48,40.98],[41.58,41.88],[41.88,42.22],[42.22,42.82],[43.16,43.34],[43.34,43.9],[43.9,44.44],[44.44,44.8],[44.8,45.14],[45.14,45.68],[45.68,45.86],[45.86,46.4],null,[46.92,47.14],[47.14,47.42],[47.42,47.6],[47.6,48.02],[48.68,48.84],[48.84,49.32],[49.32,49.36],[49.36,49.76],[49.76,50.26],[50.64,50.8],[50.8,50.96],[50.96,51.22],[51.22,51.46],[51.46,51.68],[51.68,52.14],[52.14,52.44],[52.44,52.68],[52.68,53.22],[53.22,53.44],[53.44,53.68],[53.68,53.94],[53.94,54.26],[54.26,54.6],[54.6,55.32],[56.04,56.3],[56.3,56.66],[56.66,57.02],[57.02,57.4],[57.4,57.78],[57.78,58.1],[58.1,58.48],[58.48,58.7],[58.7,58.96],[58.96,59.2],[59.2,59.46],[59.46,59.88],[59.88,60.16],[60.16,60.82],[61.24,61.5],[61.5,61.78],[61.78,62],[62,62.3],[62.3,62.7],[62.7,62.98],[62.98,63.32],[63.32,63.9],[64.48,64.76],[64.76,65.2],[65.2,65.52],[65.52,66.02],[66.02,66.46],[66.46,66.82],[66.82,67.02],[67.02,67.28],[67.28,67.54],[67.54,67.84],[67.84,68.32],[68.32,68.55],[68.55,68.78],[68.78,69.16],[69.94,70.14],[70.14,70.58],[70.58,70.86],[70.86,71.1],[71.1,71.36],[71.36,71.8],[71.8,72.2],[72.2,72.66],[73.24,73.58],[73.58,73.61],[73.61,73.78],[73.78,74.26],[74.26,74.52],[74.52,74.76],[74.76,75.06],[75.06,75.28],[75.28,75.56],[75.56,75.68],[75.68,75.84],[75.84,76.2],[76.62,76.74],[76.74,77.04],[77.04,77.38],[77.38,77.7],[77.7,78.06],[78.06,78.4],[78.4,78.7],[79.36,79.68],[79.68,79.92],[79.92,80.12],[80.12,80.36],[80.36,80.66],[80.66,81.1],[81.1,81.3],[81.3,81.92],[81.92,82.48],[82.48,82.8],[82.8,83.16],[83.16,83.5],[83.5,83.9],[84.3,84.44],[84.44,84.68],[84.68,84.98],[84.98,85.3],[85.3,85.64],[85.64,85.96],[85.96,86.38],[87.04,87.32],[87.64,87.82],[87.82,88.02],[88.02,88.3],[88.3,88.6],[88.6,88.98],[88.98,89.32],[89.32,89.64],[89.64,89.96],[89.96,90.32],[90.32,90.72],[90.72,91],[91,91.3],[91.3,91.6],[91.6,92.02],[92.7,92.98],[92.98,93.26],[93.26,93.72],[93.72,94.28],[94.52,94.8],[94.8,95.26],[95.26,95.58],[95.58,96.02],[96.02,96.34],[96.34,96.68],[96.68,97.1],[97.1,97.74],[97.74,98.28],[98.28,98.31],[98.31,98.5],[98.5,98.88],[98.88,99.24],[99.24,99.48],[99.48,99.8],[99.8,100.14]]
        },
        "title": "第三列",
        "theme": {
          "zh": "中世纪城堡攻防",
          "en": "Medieval Castle Clash"
        },
        "words": [
          {
            "id": "s7col3-intricate",
            "word": "intricate",
            "pos": "adj.",
            "meaning": "复杂的；精细的"
          },
          {
            "id": "s7col3-mortal",
            "word": "mortal",
            "pos": "adj.",
            "meaning": "致命的；凡人的"
          },
          {
            "id": "s7col3-enclose",
            "word": "enclose",
            "pos": "v.",
            "meaning": "围绕；圈起"
          },
          {
            "id": "s7col3-affiliated",
            "word": "affiliated",
            "pos": "adj.",
            "meaning": "附属的；有关联的"
          },
          {
            "id": "s7col3-sturdy",
            "word": "sturdy",
            "pos": "adj.",
            "meaning": "坚固的；强壮的"
          },
          {
            "id": "s7col3-humiliate",
            "word": "humiliate",
            "pos": "v.",
            "meaning": "羞辱；使丢脸"
          },
          {
            "id": "s7col3-propagate",
            "word": "propagate",
            "pos": "v.",
            "meaning": "繁殖；传播"
          },
          {
            "id": "s7col3-propaganda",
            "word": "propaganda",
            "pos": "n.",
            "meaning": "宣传"
          },
          {
            "id": "s7col3-scramble",
            "word": "scramble",
            "pos": "v.",
            "meaning": "攀爬；争夺"
          },
          {
            "id": "s7col3-reproach",
            "word": "reproach",
            "pos": "v.",
            "meaning": "责备；指责"
          },
          {
            "id": "s7col3-perplexing",
            "word": "perplexing",
            "pos": "adj.",
            "meaning": "令人困惑的"
          },
          {
            "id": "s7col3-bewildered",
            "word": "bewildered",
            "pos": "adj.",
            "meaning": "困惑的；不知所措的"
          },
          {
            "id": "s7col3-stagnate",
            "word": "stagnate",
            "pos": "v.",
            "meaning": "停滞；不景气"
          },
          {
            "id": "s7col3-outrageous",
            "word": "outrageous",
            "pos": "adj.",
            "meaning": "蛮横的；骇人听闻的"
          },
          {
            "id": "s7col3-snatch",
            "word": "snatch",
            "pos": "v.",
            "meaning": "夺取；抢走"
          },
          {
            "id": "s7col3-counteract",
            "word": "counteract",
            "pos": "v.",
            "meaning": "抵消；对抗"
          },
          {
            "id": "s7col3-assassinate",
            "word": "assassinate",
            "pos": "v.",
            "meaning": "行刺"
          },
          {
            "id": "s7col3-dubious",
            "word": "dubious",
            "pos": "adj.",
            "meaning": "怀疑的；靠不住的"
          }
        ],
        "paragraphs": [
          {
            "id": "s7col3-p1",
            "segments": [
              "The siege of Dunmore Castle had entered its fortieth day, and the defenders were beginning to ",
              {
                "vocabId": "s7col3-stagnate",
                "text": "stagnate"
              },
              " in their despair. The walls, though ",
              {
                "vocabId": "s7col3-sturdy",
                "text": "sturdy"
              },
              ", could not hold forever against the ",
              {
                "vocabId": "s7col3-intricate",
                "text": "intricate"
              },
              " war machines that the besieging army rolled into position each dawn. King Aldric's engineers had designed siege towers of terrifying complexity, each one built to ",
              {
                "vocabId": "s7col3-enclose",
                "text": "enclose"
              },
              " dozens of soldiers within walls of iron-bound timber. The king's heralds continued to ",
              {
                "vocabId": "s7col3-propagate",
                "text": "propagate"
              },
              " tales of inevitable victory, flooding the countryside with ",
              {
                "vocabId": "s7col3-propaganda",
                "text": "propaganda"
              },
              " designed to break the defenders' will."
            ],
            "analysis": {
              "translation": "对邓莫尔城堡的围困已经进入第四十天，守军开始在绝望中陷入停滞。城墙虽然坚固，却无法永远抵挡围城军队每天黎明推入阵地的精巧战争机器。奥德里克国王的工程师们设计了复杂得令人恐惧的攻城塔，每一座都旨在将数十名士兵围困在铁箍木墙之中。国王的传令官们继续传播必然胜利的故事，用旨在摧毁守军意志的宣传淹没整个乡野。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “对邓莫尔城堡的围困已经进入第四十天，守军开始在绝望…” → “奥德里克国王的工程师们设计了复杂得令人恐惧的攻城塔…” → “国王的传令官们继续传播必然胜利的故事，用旨在摧毁守…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">the defenders were beginning to stagnate in their despair</span>，由 and 连接两个并列分句，<span class=\"keyword\">The siege of Dunmore Castle had entered its fortieth day</span> 为第一分句，stagnate 意为“停滞”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">The walls could not hold forever</span>，<span class=\"keyword\">though sturdy</span> 为让步状语（省略 they were），<span class=\"keyword\">against the intricate war machines that the besieging army rolled into position each dawn</span> 为介词短语作状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">that the besieging army rolled into position each dawn</span> 为定语从句修饰 war machines，roll into position（推入阵地）为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">King Aldric's engineers had designed siege towers of terrifying complexity</span>，<span class=\"keyword\">each one built to enclose dozens of soldiers within walls of iron-bound timber</span> 为独立主格结构作伴随状语。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">built to enclose dozens of soldiers within walls of iron-bound timber</span> 中 built 为过去分词，enclose...within...（把……围在……之内）为固定搭配，iron-bound（铁箍的）为复合形容词。这种压缩结构把背景或伴随动作并入主句，使信息更紧凑，也避免连续使用多个完整分句。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">The king's heralds continued to propagate tales of inevitable victory</span>，<span class=\"keyword\">flooding the countryside with propaganda designed to break the defenders' will</span> 为现在分词短语作伴随状语，<span class=\"keyword\">designed to break the defenders' will</span> 为过去分词短语作后置定语修饰 propaganda。",
                "<span class=\"keyword\">语境搭配</span>：stagnate 出现在“beginning to stagnate in their despair”中，本段取“停滞”义；sturdy 出现在“though sturdy”中，本段取“坚固的”义；intricate 出现在“against the intricate war machines that”中，本段取“复杂的”义；enclose 出现在“built to enclose dozens of soldiers”中，本段取“围绕”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col3-p2",
            "segments": [
              "Inside the keep, Lord Cadwen stood ",
              {
                "vocabId": "s7col3-bewildered",
                "text": "bewildered"
              },
              " by the sudden turn of events. Only weeks earlier, his ",
              {
                "vocabId": "s7col3-affiliated",
                "text": "affiliated"
              },
              " bannermen had sworn oaths of reinforcement — yet none had arrived. It was a ",
              {
                "vocabId": "s7col3-perplexing",
                "text": "perplexing"
              },
              " betrayal, and the lords who remained loyal could only ",
              {
                "vocabId": "s7col3-reproach",
                "text": "reproach"
              },
              " one another for the catastrophic failure. Some whispered that Cadwen should surrender before the king sought to ",
              {
                "vocabId": "s7col3-humiliate",
                "text": "humiliate"
              },
              " him publicly, parading him in chains before the entire realm. Others considered it ",
              {
                "vocabId": "s7col3-outrageous",
                "text": "outrageous"
              },
              " to even speak of yielding while the banner still flew."
            ],
            "analysis": {
              "translation": "在主楼里，卡德温勋爵对事态的突然转变感到困惑。仅仅几周前，他结盟的封臣们还宣誓增援——然而没有一人到来。这是一次令人费解的背叛，仍然忠诚的领主们只能为这场灾难性的失败互相指责。有人低声说卡德温应该在国王寻求公开羞辱他、把他戴着锁链游街示众于整个王国之前就投降。另一些人则认为，只要旗帜还在飘扬，就连谈论投降都是令人愤慨的。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “在主楼里，卡德温勋爵对事态的突然转变感到困惑” → “这是一次令人费解的背叛，仍然忠诚的领主们只能为这场…” → “另一些人则认为，只要旗帜还在飘扬，就连谈论投降都是…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Lord Cadwen stood bewildered by the sudden turn of events</span>，<span class=\"keyword\">Inside the keep</span> 为地点状语，bewildered 为过去分词作表语/状语，<span class=\"keyword\">by the sudden turn of events</span> 为原因状语。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">his affiliated bannermen had sworn oaths of reinforcement</span>，<span class=\"keyword\">Only weeks earlier</span> 为时间状语，破折号后 <span class=\"keyword\">yet none had arrived</span> 为转折说明。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">It was a perplexing betrayal</span>，<span class=\"keyword\">and the lords who remained loyal could only reproach one another for the catastrophic failure</span> 为并列分句。",
                "<span class=\"keyword\">结构拆解</span>：<span class=\"keyword\">who remained loyal</span> 为定语从句修饰 lords，reproach sb. for sth.（因某事指责某人）为固定搭配。阅读时先确认它修饰的对象，再暂时略过修饰部分，句子主干就会立刻显出来。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">Some whispered that Cadwen should surrender before the king sought to humiliate him publicly</span>，whispered 后接 that 引导的宾语从句，<span class=\"keyword\">before the king sought to humiliate him publicly</span> 为时间状语从句。",
                "<span class=\"keyword\">句子骨架</span>：<span class=\"keyword\">parading him in chains before the entire realm</span> 为现在分词短语作方式状语，修饰 humiliate，in chains（戴着锁链）为固定搭配。末句主干为 <span class=\"keyword\">Others considered it outrageous to even speak of yielding while the banner still flew</span>，<span class=\"keyword\">while the banner still flew</span> 为时间/让步状语从句。",
                "<span class=\"keyword\">语境搭配</span>：bewildered 出现在“Cadwen stood bewildered by the sudden”中，本段取“困惑的”义；affiliated 出现在“his affiliated bannermen had sworn”中，本段取“附属的”义；perplexing 出现在“was a perplexing betrayal”中，本段取“令人困惑的”义；reproach 出现在“could only reproach one another for”中，本段取“责备”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          },
          {
            "id": "s7col3-p3",
            "segments": [
              "Cadwen refused to let fear ",
              {
                "vocabId": "s7col3-counteract",
                "text": "counteract"
              },
              " his resolve. When a traitor attempted to ",
              {
                "vocabId": "s7col3-snatch",
                "text": "snatch"
              },
              " the keys to the inner gate, he was seized and executed at dawn. Rumors that the king planned to ",
              {
                "vocabId": "s7col3-assassinate",
                "text": "assassinate"
              },
              " Cadwen personally had circulated for days, though the sources were ",
              {
                "vocabId": "s7col3-dubious",
                "text": "dubious"
              },
              " at best. Still, the threat of ",
              {
                "vocabId": "s7col3-mortal",
                "text": "mortal"
              },
              " combat hung over every decision made within those stone walls. Whenever the ramparts trembled, soldiers would ",
              {
                "vocabId": "s7col3-scramble",
                "text": "scramble"
              },
              " to reinforce the breaches, knowing that a single failure could doom them all."
            ],
            "analysis": {
              "translation": "卡德温拒绝让恐惧削弱他的决心。当一名叛徒试图夺取内门的钥匙时，他被抓住并在黎明时被处决。关于国王计划亲自暗杀卡德温的谣言已经流传了数天，尽管消息来源充其量也只是可疑的。尽管如此，殊死搏斗的威胁笼罩着石墙内做出的每一个决定。每当城垛颤抖，士兵们就会争先恐后地加固缺口，因为他们知道一次失败就可能让他们全部覆灭。",
              "points": [
                "<span class=\"keyword\">段落脉络</span>：本段按 “卡德温拒绝让恐惧削弱他的决心” → “关于国王计划亲自暗杀卡德温的谣言已经流传了数天，尽…” → “每当城垛颤抖，士兵们就会争先恐后地加固缺口，因为他…” 的顺序展开。原文含有明显的转折或对照，转折后的信息通常才是作者真正要强调的落点。",
                "<span class=\"keyword\">句子骨架</span>：首句主干为 <span class=\"keyword\">Cadwen refused to let fear counteract his resolve</span>，refuse to do（拒绝做），let sb. do sth.（让……做……）中 counteract 为不带 to 的不定式作宾补，counteract 意为“削弱”。",
                "<span class=\"keyword\">句子骨架</span>：第二句主干为 <span class=\"keyword\">he was seized and executed at dawn</span>，<span class=\"keyword\">When a traitor attempted to snatch the keys to the inner gate</span> 为时间状语从句，使用被动语态 was seized and executed，at dawn 为时间状语。",
                "<span class=\"keyword\">句子骨架</span>：第三句主干为 <span class=\"keyword\">Rumours had circulated for days</span>，<span class=\"keyword\">that the king planned to assassinate Cadwen personally</span> 为 Rumours 的同位语从句（后置），<span class=\"keyword\">though the sources were dubious at best</span> 为让步状语从句，at best（充其量）为固定搭配。",
                "<span class=\"keyword\">句子骨架</span>：第四句主干为 <span class=\"keyword\">the threat of mortal combat hung over every decision made within those stone walls</span>，<span class=\"keyword\">Still</span> 表递进，hang over（笼罩）为固定搭配，<span class=\"keyword\">made within those stone walls</span> 为过去分词短语作后置定语修饰 decision。",
                "<span class=\"keyword\">句子骨架</span>：末句主干为 <span class=\"keyword\">soldiers would scramble to reinforce the breaches</span>，<span class=\"keyword\">Whenever the ramparts trembled</span> 为时间状语从句，<span class=\"keyword\">knowing that a single failure could doom them all</span> 为现在分词短语作伴随状语，knowing 后接 that 引导的宾语从句。",
                "<span class=\"keyword\">语境搭配</span>：counteract 出现在“let fear counteract his resolve”中，本段取“抵消”义；snatch 出现在“attempted to snatch the keys to”中，本段取“夺取”义；assassinate 出现在“planned to assassinate Cadwen personally had”中，本段取“行刺”义；dubious 出现在“sources were dubious at best”中，本段取“怀疑的”义。把词连同身边的介词、动词或名词一起记，比孤立背中文释义更容易迁移到新句子中。"
              ]
            }
          }
        ]
      }
    ]
  }
];
  var setMap = Object.create(null);
  var columnMap = Object.create(null);
  var wordMap = Object.create(null);
  var paragraphMap = Object.create(null);
  var occurrenceMap = Object.create(null);
  var entryMap = Object.create(null);
  var allEntries = [];

  /*
   * 教材中的 word.id 表示一次“出现”，学习档案需要表示稳定的“词条”。
   * 只有人工确认同词性、同核心义的重复项才归并；不能按英文字符串自动去重，
   * 否则 brisk 一类同形异义词会错误共享进度。
   */
  var canonicalAliases = {
    's6col2-radiate': 's1col1-radiate',
    's6col4-proximity': 's1col1-proximity',
    's6col3-barren': 's1col1-barren',
    's3col5-inferior': 's2col2-inferior',
    's6col4-discern': 's4col3-discern'
  };

  /*
   * 用四张扁平索引换取后续功能的 O(1) 查询。所有模块都引用同一份对象，
   * 所以通过扩展 API 加入内容时，数组顺序和索引会同步更新。
   */
  function indexSet(set) {
    setMap[set.id] = set;
    set.columns.forEach(function(column) {
      columnMap[column.id] = column;
      column.words.forEach(function(word) { wordMap[word.id] = word; });
      column.paragraphs.forEach(function(paragraph) { paragraphMap[paragraph.id] = paragraph; });
    });
  }

  sets.forEach(indexSet);

  function normalizeSentenceText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function sentenceForSegment(segments, segmentIndex) {
    var text = '';
    var start = 0;
    var end = 0;
    segments.forEach(function(segment, index) {
      var part = typeof segment === 'string' ? segment : segment.text;
      if (index === segmentIndex) start = text.length;
      text += part;
      if (index === segmentIndex) end = text.length;
    });
    var left = start;
    while (left > 0 && !/[.!?]/.test(text.charAt(left - 1))) left--;
    var right = end;
    while (right < text.length && !/[.!?]/.test(text.charAt(right))) right++;
    if (right < text.length) right++;
    return normalizeSentenceText(text.slice(left, right));
  }

  function buildCanonicalIndex() {
    occurrenceMap = Object.create(null);
    entryMap = Object.create(null);
    allEntries = [];
    var sourceOrder = 0;

    sets.forEach(function(set) {
      set.columns.forEach(function(column) {
        var firstContextByOccurrence = Object.create(null);
        column.paragraphs.forEach(function(paragraph) {
          paragraph.segments.forEach(function(segment, segmentIndex) {
            if (typeof segment === 'string' || firstContextByOccurrence[segment.vocabId]) return;
            firstContextByOccurrence[segment.vocabId] = {
              paragraphId: paragraph.id,
              sentence: sentenceForSegment(paragraph.segments, segmentIndex)
            };
          });
        });

        /* 正文首次出现顺序优先；极端缺失语境时才退回原词表顺序。 */
        var orderedIds = [];
        column.paragraphs.forEach(function(paragraph) {
          paragraph.segments.forEach(function(segment) {
            if (typeof segment !== 'string' && orderedIds.indexOf(segment.vocabId) < 0) orderedIds.push(segment.vocabId);
          });
        });
        column.words.forEach(function(word) {
          if (orderedIds.indexOf(word.id) < 0) orderedIds.push(word.id);
        });

        orderedIds.forEach(function(occurrenceId) {
          var word = wordMap[occurrenceId];
          if (!word) return;
          var entryId = canonicalAliases[occurrenceId] || occurrenceId;
          var contextInfo = firstContextByOccurrence[occurrenceId] || { paragraphId: '', sentence: '' };
          var occurrence = {
            id: occurrenceId,
            occurrenceId: occurrenceId,
            entryId: entryId,
            word: word,
            set: set,
            column: column,
            paragraphId: contextInfo.paragraphId,
            contextSentence: contextInfo.sentence,
            sourceOrder: sourceOrder++
          };
          occurrenceMap[occurrenceId] = occurrence;
          if (!entryMap[entryId]) {
            entryMap[entryId] = {
              id: entryId,
              entryId: entryId,
              word: word.word,
              pos: word.pos,
              meaning: word.meaning,
              sourceOrder: occurrence.sourceOrder,
              primaryOccurrenceId: occurrenceId,
              occurrences: [],
              contexts: []
            };
            allEntries.push(entryMap[entryId]);
          }
          entryMap[entryId].occurrences.push(occurrence);
          entryMap[entryId].contexts.push({
            occurrenceId: occurrenceId,
            setId: set.id,
            setLabel: set.label,
            columnId: column.id,
            columnTitle: column.title,
            paragraphId: contextInfo.paragraphId,
            sentence: contextInfo.sentence,
            sourceOrder: occurrence.sourceOrder
          });
        });
      });
    });
    allEntries.sort(function(a, b) { return a.sourceOrder - b.sourceOrder; });
  }

  buildCanonicalIndex();

  // 扩展 API 在写入前拒绝未知父级和重复 ID，尽早暴露内容装配错误。
  function addWords(columnId, words) {
    var column = columnMap[columnId];
    if (!column) throw new Error('Unknown column: ' + columnId);
    words.forEach(function(word) {
      if (!word.id || wordMap[word.id]) throw new Error('Invalid or duplicate word id: ' + word.id);
      column.words.push(word);
      wordMap[word.id] = word;
    });
    buildCanonicalIndex();
  }

  function addParagraphs(columnId, paragraphs) {
    var column = columnMap[columnId];
    if (!column) throw new Error('Unknown column: ' + columnId);
    paragraphs.forEach(function(paragraph) {
      if (!paragraph.id || paragraphMap[paragraph.id]) throw new Error('Invalid or duplicate paragraph id: ' + paragraph.id);
      column.paragraphs.push(paragraph);
      paragraphMap[paragraph.id] = paragraph;
    });
    buildCanonicalIndex();
  }

  function addSet(set) {
    if (!set.id || setMap[set.id]) throw new Error('Invalid or duplicate set id: ' + set.id);
    sets.push(set);
    indexSet(set);
    buildCanonicalIndex();
  }

  function countWords(set) {
    return set.columns.reduce(function(total, column) { return total + column.words.length; }, 0);
  }

  function getMeta(set) {
    return set.label + ' · ' + set.columns.length + '列' + countWords(set) + '词 · 在阅读中记忆单词 · 目标词高亮标注';
  }

  return {
    sets: sets,
    getSet: function(id) { return setMap[id] || null; },
    getColumn: function(id) { return columnMap[id] || null; },
    getWord: function(id) { return wordMap[id] || null; },
    getParagraph: function(id) { return paragraphMap[id] || null; },
    resolveEntryId: function(occurrenceId) {
      return occurrenceMap[occurrenceId] ? occurrenceMap[occurrenceId].entryId : (canonicalAliases[occurrenceId] || occurrenceId || '');
    },
    getEntry: function(id) {
      var entryId = occurrenceMap[id] ? occurrenceMap[id].entryId : (canonicalAliases[id] || id);
      return entryMap[entryId] || null;
    },
    getOccurrence: function(id) { return occurrenceMap[id] || null; },
    getContexts: function(id) {
      var entry = this.getEntry(id);
      return entry ? entry.contexts.slice() : [];
    },
    getAllEntries: function() { return allEntries.slice(); },
    addWords: addWords,
    addParagraphs: addParagraphs,
    addSet: addSet,
    countWords: countWords,
    getMeta: getMeta
  };
})();
