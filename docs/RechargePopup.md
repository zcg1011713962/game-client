# 充值 / 提现预制体

预制体：`assets/bundle_shop/prefabs/RechargePopup.prefab`

按提供的竖屏设计图制作，设计尺寸为 750 × 1500。深蓝底、青红霓虹外框、USDT 横幅使用独立背景图片；文字、页签、金额选项、地址栏及按钮均为独立节点，可在 Cocos Creator 2.4.11 中编辑。运行时按可视区域等比缩放。

## 加载

```ts
import ShopRes from "./ShopRes";
import RechargePopup from "./RechargePopup";

const prefab = await ShopRes.instance.loadRechargePrefab();
const node = cc.instantiate(prefab);
cc.find("Canvas").addChild(node);
node.setPosition(0, 0);

const popup = node.getComponent(RechargePopup);
// 组件会自动获取 hall 支付配置，并恢复本人的待支付订单。
// 选择金额后点击“生成订单”，二维码和精确金额由服务端订单提供。
node.on("recharge-withdraw", () => {
    // 接入提现流程。
});
node.on("recharge-copy-address", (address: string) => {
    // 非浏览器平台在这里调用原生剪贴板。
});
```

## 当前交互

- 默认选择 10 USDT，可选 20、50、100、500，以及自定义金额。自定义金额大于 0、不超过 1,000,000，最多两位小数。
- `coinsPerUsdt` 默认显示 1 USDT ≈ 100 金币，加载后以 hall 返回的充值配置为准。创建订单时保存兑换结果。
- 浏览器地址复制使用 Clipboard API；空地址不复制。非浏览器平台发送复制事件。
- 未设置地址和二维码时显示等待状态，不包含示例收款地址或伪造二维码。
- 已接入 hall 的 OKX USDT-TRC20 建单、状态查询和分页充值记录；每 5 秒查询当前订单，成功后刷新大厅金币。提现页签仍展示暂未开放。
- 共享收款地址通过六位精确金额匹配订单。用户必须按“应转金额”付款，识别尾差不计入金币，转出手续费另付。
- 订单到期或到账后隐藏地址及二维码。订单到期后后端仍核对迟到充值；关闭界面不取消已生成的订单。
- 关闭按钮销毁弹窗。大厅金币、房卡的“+”和底部商城按钮均通过 `HallUIManager.showShop()` 打开此预制体；连续点击复用单个弹窗，关闭后可重新打开。

## 文件

- `assets/scripts/shop/RechargePopup.ts`：交互及外部数据入口。
- `assets/scripts/shop/PaymentApi.ts`：认证请求、客户端幂等请求号。
- `assets/scripts/shop/RechargePanelStyle.ts`：编辑器和运行时绘制选框、面板表面。
- `assets/bundle_shop/recharge/recharge_background.png`：按参考图生成的背景美术。

## 验证范围

已做独立 TypeScript 类型检查、预制体序列化引用校验和支付交互逻辑检查。项目原有 `creator.d.ts` 的一个声明缺少逗号，检查时仅在临时副本修正，该源文件未改动。尚未在 Cocos 运行画面中进行视觉验收，也未进行真实转账。

服务端配置、建表与对账说明见 `D:/coding/game-server/hall/docs/okx-payment.md`。需要先执行建表脚本、配置 OKX 只读 API 密钥与收款地址，再开启服务端支付开关。
