# Cocos Game Client Project Notes

本文档基于当前项目代码与资源结构整理，用于快速理解客户端职责、UI 节点、网络入口和牌九核心流程。

## 1. 主要 TS 脚本职责

### 配置与通用工具

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/config/Config.ts` | 服务器协议、主机、端口、API/WS 基础 URL 配置。 |
| `assets/scripts/util/Http.ts` | HTTP POST 封装，支持 callback 与 Promise 两种调用方式，可附加 headers。 |
| `assets/scripts/util/SceneUtil.ts` | 场景跳转工具；普通场景走 `cc.director.loadScene`，bundle 场景走 `cc.assetManager.loadBundle + bundle.loadScene + runScene`。 |
| `assets/scripts/util/UIUtil.ts` | Label 文本、颜色、描边等 UI 快捷设置。 |
| `assets/scripts/util/UIColorUtil.ts` | 项目常用颜色集中定义。 |
| `assets/scripts/common/ui/BgFit.ts` | 背景适配组件。 |
| `assets/scripts/common/ui/UIZOrder.ts` | 公共弹窗、Toast 等 zIndex 层级定义。 |
| `assets/scripts/net/NetMsg.ts` | 通用网络消息结构。当前核心 WebSocket 逻辑主要在 `WsClient.ts`。 |

### Loading / Login

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/loading/Loading.ts` | 启动加载页，预加载登录、大厅、游戏资源，更新进度条并切场景。当前代码最终固定跳到 `login`。 |
| `assets/scripts/login/LoginRes.ts` | 登录相关公共资源加载，如 Toast、鼠标光标等资源。 |
| `assets/scripts/login/Login.ts` | 登录页主逻辑；游客登录、token 失效重试、本地用户数据保存、进入大厅。 |
| `assets/scripts/login/AgreementCheck.ts` | 用户协议勾选按钮逻辑。 |
| `assets/scripts/login/GlobalBoot.ts` | 初始化全局鼠标光标节点并绑定 Canvas。 |
| `assets/scripts/login/entity/User.ts` | 登录用户数据结构。 |
| `assets/scripts/login/entity/UserData.ts` | 用户数据本地持久化，保存、读取、清理、更新金币/房卡/昵称/头像。 |
| `assets/scripts/login/entity/ServerMsg.ts` | HTTP 服务端响应结构。 |
| `assets/scripts/login/entity/ResultCode.ts` | 业务结果码枚举。 |

### 大厅

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/hall/HallRes.ts` | 大厅 bundle 资源加载与缓存：TopBar、GameCard、房间弹窗、战绩、头像、banner、底栏图标、音频。 |
| `assets/scripts/hall/HallUIManager.ts` | 大厅主控制器；初始化顶部栏、游戏卡片、BGM，连接 WebSocket，处理进房、商店购买、战绩弹窗。 |
| `assets/scripts/hall/GameCardComponent.ts` | 大厅游戏卡片组件，加载卡片背景/icon，点击后抛出 `GameCard_CLICK`。 |
| `assets/scripts/hall/CameCardComponentManager.ts` | 大厅游戏卡片组件与数据列表缓存。 |
| `assets/scripts/hall/top/HallTopBar.ts` | 大厅顶部用户信息、金币、房卡展示；点击加号打开商店。 |
| `assets/scripts/hall/bottom/HallBottomBar.ts` | 大厅底栏按钮；商店与战绩入口。 |
| `assets/scripts/hall/room/RoomSelectPopup.ts` | 游戏卡片点击后的模式选择弹窗：创建房间、加入房间、自由匹配。 |
| `assets/scripts/hall/room/CreateRoomPopup.ts` | 创建房间弹窗，组装 `CreateRoomReq` 并通过大厅 Manager 发送创建请求。 |
| `assets/scripts/hall/room/JoinRoomPopup.ts` | 加入房间弹窗，数字键盘输入 6 位房号并发送 `ENTER_ROOM`。 |
| `assets/scripts/hall/entity/GameCardData.ts` | 大厅游戏卡片数据结构。 |
| `assets/scripts/hall/entity/CreateRoomReq.ts` | 创建房间请求结构。 |

### 商店

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/shop/ShopRes.ts` | 商店 bundle 与商店/确认购买 prefab 加载。 |
| `assets/scripts/shop/Shop.ts` | 商店主面板，展示房卡商品、刷新顶部资产、打开购买确认弹窗。 |
| `assets/scripts/shop/BuyConfirmPopup.ts` | 购买确认弹窗，确认后回调大厅购买接口。 |

### 公共弹窗与提示

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/common/ToastManager.ts` | Toast 弹窗统一入口，实例化 Toast prefab 并挂到 Canvas。 |
| `assets/scripts/common/ToastView.ts` | Toast 显示动画和销毁逻辑。 |
| `assets/scripts/common/SettleManager.ts` | 结算弹窗统一入口，持有结算 prefab 并显示/关闭。 |
| `assets/scripts/common/SettlePopup.ts` | 结算面板展示胜负、金币变化、牌型、描述等。 |
| `assets/scripts/common/RoundStartPopup.ts` | 新一局开始动画，按服务端时间判断是否过期。 |
| `assets/scripts/common/MouseCursorManager.ts` | 自定义鼠标光标跟随。 |
| `assets/scripts/common/CountDownManager.ts` | 倒计时统一入口，实例化 `ClockCountdown` 到游戏桌面。 |
| `assets/scripts/common/countdown/ClockCountdown.ts` | 倒计时组件，按本地结束时间刷新秒数，最后 5 秒播放警告音与晃动动画。 |
| `assets/scripts/common/entity/PageResult.ts` | 分页接口数据结构。 |

### 游戏主流程与资源

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/game/pj/GameRes.ts` | 游戏 bundle 资源预加载与缓存：座位、筹码、牌、顶部栏、抢庄、看牌、倒计时、开局动画、音频等。 |
| `assets/scripts/game/pj/Game.ts` | 游戏场景入口；初始化座位布局、播放游戏 BGM、通知 `ClientRoomManager` 场景就绪。 |
| `assets/scripts/game/pj/ui/UIManager.ts` | 游戏 UI 总控；实例化顶部栏、筹码选择、抢庄、看牌、准备按钮，清理桌面，处理准备/取消准备/亮牌/搓牌。 |
| `assets/scripts/game/pj/PaiJiuTable.ts` | 牌桌动画核心；洗牌、发牌、亮牌、搓牌、前后台恢复、按服务端时间补帧。 |
| `assets/scripts/game/pj/card/PaiJiuCard.ts` | 单张牌组件；正反面显示、翻到正面/背面动画。 |
| `assets/scripts/game/pj/enum/Cmd.ts` | WebSocket 协议命令枚举。 |
| `assets/scripts/game/pj/net/WsClient.ts` | WebSocket 单例；连接、重连、心跳、发送消息、接收消息并分发到 `ClientRoomManager`。 |
| `assets/scripts/game/pj/room/ClientRoomManager.ts` | 房间状态与服务端推送处理核心；维护房间/玩家/座位/庄家/下注/牌局状态，驱动 UI 与牌桌流程。 |
| `assets/scripts/game/pj/room/RoomState.ts` | 房间状态枚举：等待、准备、抢庄、下注、发牌、结算。 |
| `assets/scripts/game/pj/room/Room.ts` | 本地房间模型。 |
| `assets/scripts/game/pj/room/LookCardPopup.ts` | 看牌弹窗，提供搓牌与亮牌按钮。 |
| `assets/scripts/game/pj/banker/GrabBankerPopup.ts` | 抢庄弹窗，发送 `GRAB_BANKER`。 |
| `assets/scripts/game/btn/ReadyButton.ts` | 准备/取消准备按钮，转发到 `UIManager`。 |
| `assets/scripts/game/top/RoomTopBar.ts` | 游戏房间顶部栏；房号、人数、底分显示，离房与战绩入口。 |

### 座位、下注、玩家

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/game/pj/seat/SeatManager.ts` | 座位布局初始化、监听座位点击、发送 `SIT_DOWN`、刷新单个座位。 |
| `assets/scripts/game/pj/seat/SeatComponentManager.ts` | 座位组件列表与座位数据列表缓存。 |
| `assets/scripts/game/pj/seat/SeatComponent.ts` | 单个座位 UI；空座、入座、准备、游戏中、庄/闲、输赢、头像、金币展示。 |
| `assets/scripts/game/pj/seat/SeatData.ts` | 座位数据与座位状态。 |
| `assets/scripts/game/pj/seat/Seat.ts` | 本地座位模型，支持入座、离座、准备、游戏中状态切换。 |
| `assets/scripts/game/pj/chip/ChipSelectPanel.ts` | 筹码按钮面板，点击后发送 `BET`。 |
| `assets/scripts/game/pj/chip/BetArea.ts` | 下注区筹码飞行动画和清理。 |
| `assets/scripts/game/pj/chip/Chip.ts` | 单个筹码展示与飞行动画。 |
| `assets/scripts/game/pj/user/UserInfo.ts` | 玩家状态与玩家信息模型。 |
| `assets/scripts/game/pj/user/CurrUserManager.ts` | 从 `UserData` 读取当前用户。 |

### 战绩

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/game/pj/record/RecordApi.ts` | 战绩 HTTP 查询入口，调用 `/settle/record`。 |
| `assets/scripts/game/pj/record/RecordPopup.ts` | 战绩弹窗，分页加载、滚动到底加载更多、实例化战绩 item。 |
| `assets/scripts/game/pj/record/RecordItem.ts` | 单条战绩显示。 |
| `assets/scripts/game/pj/record/SettleRecord.ts` | 战绩请求与返回结构。 |

### 其他辅助

| 文件 | 职责 |
| --- | --- |
| `assets/scripts/game/pj/util/PaiJiuUtil.ts` | 牌九工具方法，目前主要用于等待指定秒数。 |
| `assets/scripts/game/pj/util/DelayTaskUtil.ts` | 延迟任务单例，封装定时执行。 |
| `assets/scripts/game/pj/ui/PosDebug.ts` | 坐标调试组件。 |

## 2. UI 节点结构

### Loading 场景：`assets/scene/loading.fire`

```text
Canvas
  Main Camera
  Logo
  LoadingRoot
    ProgressBg
      ProgressBar
    Label_Percent
    Label_Tip
```

### Login 场景：`assets/scene/login.fire`

代码实际访问的关键节点：

```text
Canvas
  LoginPanel
    Btn_Guest
  Agreement
```

资源解析中还可见登录场景包含 `Main Camera`、`BG`、`Top/Logo`、`Role/Girl`、`LoginPanel` 等节点。

### Hall 场景：`assets/scene/hall.fire`

```text
Canvas
  Main Camera
  BG
    bg_lobby
  TopBar
  NoticeBar
  Banner
    BannerImg
  GameCard
    View
    ScrollBar
  RoomSelectPanel
  JoinRoomPanel
  CreateRoomPopupPanel
  BottomBar
    bg
    BtnActivity
    BtnRank
    BtnRecord
    BtnShop
```

大厅运行时会把以下 prefab 挂到对应容器：

- `TopBar`：实例化 `bundle_hall/prefabs/TopBar`。
- `GameCard/View`：实例化 `bundle_hall/prefabs/GameCard`。
- `RoomSelectPanel`：实例化 `bundle_hall/prefabs/RoomSelectPanel`。
- `JoinRoomPanel`：实例化 `bundle_hall/prefabs/JoinRoomPanel`。
- `CreateRoomPopupPanel`：实例化 `bundle_hall/prefabs/CreateRoomPopup`。
- `Canvas`：打开商店时实例化 `bundle_shop/prefabs/Shop`；打开战绩时实例化 `RecordPopup`。

### Game 场景：`assets/bundle_game/scene/game_1.fire`

```text
Canvas
  Main Camera
  MainLayout
    Table
      BG
      Logo
      DeckContainer
      DealContainer
      SeatContainer
      PlayerPosRoot
        Player0Pos
        Player1Pos
        Player2Pos
        Player3Pos
        Player4Pos
        Player5Pos
        Player6Pos
        Player7Pos
      BetContainer
        BetArea0
        BetArea1
        BetArea2
        BetArea3
        BetArea4
        BetArea5
        BetArea6
        BetArea7
      ChipSelectPanel
      GrabBankerPanel
      ClockContainer
      LookCardPanel
    RoomTopBar
  UI
```

游戏运行时挂载：

- `RoomTopBar`：实例化 `bundle_game/prefabs/RoomTopBar`。
- `SeatContainer`：由 `SeatManager` 实例化 8 个 `Seat`。
- `ChipSelectPanel`：实例化 `ChipSelectPanel`。
- `GrabBankerPanel`：实例化 `GrabBankerPanel`。
- `LookCardPanel`：实例化 `LookCardPanel`。
- `ClockContainer`：倒计时时实例化 `BetCountdown`。
- `UI`：需要显示准备按钮时实例化 `ReadyButtonPrefab`。
- `Canvas`：开局动画实例化 `RoundStartPrefab`，结算实例化 `SettlePopup`。

### 关键 prefab 节点

```text
Card
  Back
  Front
  Shadow

BetCountdown
  clock
  timeLabel

LookCardPanel
  Panel
    BtnRubCard
    BtnOpenCard

GrabBankerPanel
  Panel
    Btn_Grab
    Btn_NoGrab

ChipSelectPanel
  Chip_10
    bg
  Chip_50
    bg
  Chip_100
    bg

RoomSelectPanel
  Mask
  Panel
    CreateCard
    JoinCard
    MatchCard
```

脚本中依赖的其他 prefab 节点：

- `JoinRoomPanel`：`Panel/CloseBtn`、`Panel/EnterBtn`、`Panel/InputRoot`、`Panel/Keyboard/Key0..Key9`、`KeyDel`、`KeyClear`。
- `CreateRoomPopup`：`Mask`、`Panel`、`Panel/Btn_Close`、`Panel/Btn_Create`、`Panel/ScrollView/View`。
- `Shop`：`Mask`、`Panel/CloseBtn`、`Panel/TopBar/CoinBox`、`Panel/TopBar/RoomCardBox`、`Panel/Content/ItemList`。
- `RecordPopup`：`Mask`、`BtnClose`、`ListView/View/Content`、`TitleBg`。

## 3. 网络协议入口

### HTTP

HTTP 统一封装在 `Http.ts`。

主要入口：

- `Login.ts`：`POST ${Config.API_URL}/login/guest`，游客登录/自动登录。
- `HallUIManager.ts`：`POST ${Config.API_URL}/shop/buy`，购买商品。
- `RecordApi.ts`：`POST ${Config.API_URL}/settle/record`，查询战绩。

HTTP 请求默认：

- method：`POST`
- header：`Content-Type: application/json;charset=UTF-8`
- timeout：10 秒
- token：通过调用方传入 headers，例如 `{ token }`

### WebSocket

WebSocket 统一入口：`assets/scripts/game/pj/net/WsClient.ts`。

连接流程：

1. 大厅 `HallUIManager.init()` 读取 `UserData.get()`。
2. 调用 `WsClient.instance.connectAsync(Config.WS_URL, guest.token)`。
3. `WsClient` 拼接 `baseUrl?token=...` 建立连接。
4. 连接成功后启动心跳，每 15 秒发送 `PING`。
5. 大厅发送 `ROOM_INFO` 拉取当前房间信息。

发送消息结构：

```ts
{
  cmd: string,
  seq: number,
  data: any
}
```

接收消息结构按代码假设包含：

```ts
{
  cmd: string,
  code: number,
  msg?: string,
  data: any
}
```

`WsClient.handleMessage()` 按 `cmd` 分发到 `ClientRoomManager`。

主要协议命令：

| 命令 | 方向 | 客户端落点 |
| --- | --- | --- |
| `PING` / `PONG` | 双向 | 心跳。 |
| `CREATE_ROOM` | 客户端发送 | 大厅创建房间。 |
| `FREE_MATCH` | 客户端发送 | 大厅自由匹配。 |
| `ENTER_ROOM` | 客户端发送 | 输入房号进房。 |
| `ENTER_ROOM_RESULT` | 服务端推送 | `ClientRoomManager.applyEnterRoom()`。 |
| `ROOM_INFO_RESULT` | 服务端推送 | `ClientRoomManager.applyRoomInfo()`。 |
| `PLAYER_ENTER` | 服务端推送 | `ClientRoomManager.applyPlayerEnter()`。 |
| `SIT_DOWN` | 客户端发送 | 点击空座。 |
| `SIT_DOWN_RESULT` / `PLAYER_SIT_DOWN` | 服务端推送 | `ClientRoomManager.applySitDown()`。 |
| `READY` / `CANCEL_READY` | 客户端发送 | 准备/取消准备。 |
| `READY_RESULT` | 服务端推送 | `ClientRoomManager.selfReadyOk()`。 |
| `PLAYER_READY` | 服务端推送 | `ClientRoomManager.applyPlayerReady()`。 |
| `CANCEL_READY_RESULT` | 服务端推送 | `ClientRoomManager.selfCancelReadyOk()`。 |
| `CANCEL_PLAYER_READY` | 服务端推送 | `ClientRoomManager.applyCancelPlayerReady()`。 |
| `GAME_START` | 服务端推送 | `ClientRoomManager.applyGameStart()`。 |
| `GRAB_BANKER_START` | 服务端推送 | `ClientRoomManager.grabBankerStart()`。 |
| `GRAB_BANKER` | 客户端发送 | 抢庄/不抢。 |
| `GRAB_BANKER_RESULT` | 服务端推送 | `ClientRoomManager.grabBankerEnd()`。 |
| `BET` | 客户端发送 | 下注。 |
| `BET_RESULT` | 服务端推送 | `ClientRoomManager.selfBetOk()`。 |
| `PLAYER_BET` | 服务端推送 | `ClientRoomManager.applyPlayerBet()`。 |
| `DEAL_CARD` | 服务端推送 | `ClientRoomManager.dealCard()`。 |
| `SETTLE` | 服务端推送 | `ClientRoomManager.settle()`。 |
| `NEXT_ROUND` | 服务端推送 | `ClientRoomManager.nextRound()`。 |
| `LEAVE_ROOM` | 客户端发送 | 离开房间。 |
| `LEAVE_ROOM_RESULT` | 服务端推送 | `ClientRoomManager.leaveRoom()`。 |
| `PLAYER_LEAVE` | 服务端推送 | `ClientRoomManager.playerLeaveRoom()`。 |
| `USER_ASSET_UPDATE` | 服务端推送 | `ClientRoomManager.userAssetUpdate()`。 |

## 4. 动画入口

| 动画 | 入口 | 说明 |
| --- | --- | --- |
| 大厅房间选择弹窗 | `RoomSelectPopup.show()` / `hide()` | 遮罩渐变，三张卡片依次弹入/收起。 |
| 大厅创建房间弹窗 | `CreateRoomPopup.show()` / `hide()` | 面板缩放和透明度动画。 |
| 加入房间弹窗 | `JoinRoomPopup.show()` / `hide()` | 面板缩放和透明度动画。 |
| 商店弹窗 | `Shop.showAnim()` / `hideAnim()` | 遮罩渐变，面板缩放弹出。 |
| 抢庄弹窗 | `GrabBankerPopup.show()` / `hide()` | 面板淡入缩放。 |
| 看牌弹窗 | `LookCardPopup.show()` / `hide()` | 面板淡入缩放。 |
| 新一局动画 | `UIManager.showRoundStartAnim()` -> `RoundStartPopup.play()` | 按服务端时间播放局数飞入和淡出。 |
| 倒计时警告 | `ClockCountdown.playWarn()` | 最后 5 秒播放警告音，时钟左右晃动。 |
| 洗牌 | `PaiJiuTable.shuffleAnim()` | 扑克牌随机抖动、左右分堆、合并。 |
| 发牌 | `PaiJiuTable.dealCards()` -> `dealOneCard()` | 从牌堆飞到座位目标点。 |
| 普通翻牌 | `PaiJiuCard.flipToFront()`，由 `PaiJiuTable.flipSeatCards()` 调用 | scaleX 压缩到 0.05，切正面，再展开。 |
| 搓牌 | `PaiJiuTable.playSlideRubOpenEffect()` | 自己的两张牌移到中间，第一张直接翻开，第二张通过触摸横向进度“剥开”。 |
| 筹码飞入 | `BetArea.addChip()` -> `Chip.playFlyAnim()` | 从座位位置飞到对应下注区。 |
| 结算弹窗 | `SettleManager.show()` -> `SettlePopup.show()` | 展示本局胜负和金币变化。 |

## 5. 房间流程

### 大厅进入房间

1. 登录成功后 `Login.autoLogin()` 保存 `UserData`，通过 `SceneUtil.loadScene("hall", user)` 进入大厅。
2. `HallUIManager.onLoad()` 初始化大厅 UI。
3. `HallUIManager.init()` 读取本地用户，连接 `WsClient`。
4. 连接成功后发送 `ROOM_INFO`。
5. 玩家点击大厅游戏卡片：`GameCardComponent.onClick()` 发出 `GameCard_CLICK`。
6. `HallUIManager.onGameCardClick()` 显示 `RoomSelectPopup`。
7. 三种进房方式：
   - 自由匹配：`HallUIManager.onClickCard(RoomCardType.MATCH)` -> `FREE_MATCH`。
   - 创建房间：`CreateRoomPopup.onCreateRoom()` -> `HallUIManager.onClickCard(RoomCardType.CREATE, req)` -> `CREATE_ROOM`。
   - 加入房间：`JoinRoomPopup.onEnterRoom()` -> `ENTER_ROOM`。
8. 服务端返回 `ENTER_ROOM_RESULT` 或 `ROOM_INFO_RESULT`。
9. `ClientRoomManager.applyEnterRoom()` 缓存 `RoomSnapshot`，切到 `game_1`。

### 游戏场景初始化

1. `Game.onLoad()` 获取 `Canvas/MainLayout/Table/SeatContainer`。
2. `Game.start()` 调用 `initTable()`。
3. `SeatManager.init()` 根据 `UIManager.getSeat()` 生成 8 个座位数据。
4. `SeatManager.initSeatLayout()` 实例化 8 个座位 prefab。
5. `Game` 调用 `ClientRoomManager.onGameSceneReady()`。
6. 如果 `ClientRoomManager` 已缓存 `roomSnapshot`，执行 `renderRoom()`：
   - 设置房间号、当前用户、庄家、底分、玩家、下注、牌数据。
   - 更新顶部栏。
   - 刷新所有座位。
   - 根据 `roomState` 刷新下注/抢庄 UI。

### 座位与准备

1. 玩家点击空座：`SeatComponent.onClick()` 抛出 `SEAT_CLICK`。
2. `SeatManager.onSeatClick()` 校验座位是否有人，发送 `SIT_DOWN`。
3. 服务端返回 `SIT_DOWN_RESULT` 或广播 `PLAYER_SIT_DOWN`。
4. `ClientRoomManager.applySitDown()` 更新玩家座位，刷新桌面和座位。
5. `SeatComponent.updateView()` 根据玩家状态显示准备按钮。
6. 点击准备：`ReadyButton.readyBtnClick()` -> `UIManager.readyBtnClick()` -> `READY`。
7. 点击取消准备：`ReadyButton.cancelBtnClick()` -> `UIManager.cancelBtnClick()` -> `CANCEL_READY`。
8. 服务端推送准备状态，`ClientRoomManager` 更新玩家状态并刷新座位。

### 开局、抢庄、下注、发牌、结算

1. `GAME_START` -> `ClientRoomManager.applyGameStart()`：
   - 清桌。
   - 隐藏准备按钮。
   - 更新玩家列表。
   - 按服务端时间播放局数动画。
2. `GRAB_BANKER_START` -> `ClientRoomManager.grabBankerStart()`：
   - 延迟到 `grabStartTime`。
   - 设置房间状态为抢庄。
   - 显示抢庄面板。
   - 显示抢庄倒计时。
3. 玩家点击抢/不抢：`GrabBankerPopup.submit()` -> `GRAB_BANKER`。
4. `GRAB_BANKER_RESULT` -> `ClientRoomManager.grabBankerEnd()`：
   - 设置庄家座位。
   - 更新玩家列表。
   - 延迟到 `betStartTime`。
   - 设置房间状态为下注。
   - 刷新座位庄闲标记。
   - 显示下注倒计时。
5. 玩家下注：`ChipSelectPanel` -> `BET`。
6. `PLAYER_BET` -> `ClientRoomManager.applyPlayerBet()`：
   - 更新玩家金币。
   - 自己下注后隐藏下注面板。
   - 调 `UIManager.onSelectChip()` 播放筹码飞入。
7. `DEAL_CARD` -> `ClientRoomManager.dealCard()`：
   - 关闭倒计时。
   - 设置房间状态为发牌。
   - 找到 `PaiJiuTable`。
   - 调 `PaiJiuTable.playStartAnim()`。
8. `SETTLE` -> `ClientRoomManager.settle()`：
   - 按 `settleTime` 延迟。
   - 更新玩家金币。
   - 刷新座位输赢。
   - 当前用户展示结算弹窗。
9. `NEXT_ROUND` -> `ClientRoomManager.nextRound()`：
   - 关闭结算。
   - 清桌。
   - 更新玩家与状态。
   - 显示准备按钮。

## 6. 发牌流程

入口：`ClientRoomManager.dealCard(deal: DealCardPush)`。

流程：

1. 关闭倒计时：`CountDownManager.close()`。
2. 设置房间状态：`RoomState.DEAL`。
3. 从 `UIManager.instance.getTableNode()` 获取桌面节点。
4. 获取 `PaiJiuTable` 组件。
5. 组装 `serverResult`：
   - `bankerSeat`
   - `players`
   - `serverTime`
   - `dealStartTime`
   - `showCardTime`
   - `settleTime`
   - `nextRoundTime`
6. 调用 `PaiJiuTable.playStartAnim(serverResult)`。

`PaiJiuTable.playStartAnim()` 内部流程：

1. 记录 `currentServerResult` 和 `currentDealOrder`。
2. 通过 `serverTime - Date.now()` 计算服务端时间偏移。
3. 创建 32 张牌堆：`createDeck()`。
4. 如果当前服务端时间已经超过 `showCardTime`：
   - `fastCompleteDeal(false)`
   - `fastShowAllCards()`
5. 如果已经超过 `dealStartTime` 但没到 `showCardTime`：
   - `fastCompleteDeal(false)`
   - `waitShowCardByServerTime()`
6. 如果还没到 `dealStartTime`：
   - `scheduleOnce(startShuffleByServerTime, waitDealSeconds)`
7. 洗牌结束后进入 `dealCards()`。

发牌顺序：

1. `buildDealOrder()` 取服务端玩家牌数据。
2. 以 `bankerSeat` 为起点，通过 `sortPlayersFromBanker()` 按座位顺序排序。
3. 每人 2 张，按轮次发：
   - 第一轮：庄家起，依座位顺序每人 1 张。
   - 第二轮：庄家起，依座位顺序每人第 2 张。
4. `dealOneCard()` 每隔 `dealInterval` 从 `cardList` pop 一张，移动到 `Player{seat}Pos` 对应位置。
5. 全部完成后：
   - 清理牌堆。
   - 显示 `LookCardPanel`。
   - 等待 `showCardTime` 自动亮牌。

前后台恢复：

- 回到前台时，如果已经到亮牌时间，直接补完成发牌并亮牌。
- 如果还在洗牌，停止动画并根据服务端时间继续发牌。
- 如果正在发牌，直接补齐发牌。

## 7. 翻牌流程

### 自动翻牌

入口：`PaiJiuTable.waitShowCardByServerTime()`。

1. 根据 `currentShowCardTime - getServerNow()` 计算剩余等待时间。
2. 到点调用 `showCard()`。
3. `showCard()` 如果发牌未完成会阻止翻牌。
4. 设置 `tableState = SHOW_CARD`。
5. 遍历 `ClientRoomManager.instance.getPlayers()`。
6. 对每个玩家执行：
   - `flipSeatCards(player.seatId)`
   - 翻完后 `sortSeatCards(player.seatId)`
7. 接近结算时间时调用 `fastShowAllCards()` 保证最终状态。

### 手动亮牌

入口：

1. 发牌完成后 `UIManager.setLookCardPanelVisible(true)`。
2. 玩家点击 `LookCardPopup.BtnOpenCard`。
3. `LookCardPopup.onClickOpenCard()` 隐藏面板。
4. `UIManager.showCard()`。
5. `PaiJiuTable.onClickOpenCard()`。
6. 只翻当前玩家座位的牌：`flipSeatCards(mySeatId)`。

### 搓牌

入口：

1. 玩家点击 `LookCardPopup.BtnRubCard`。
2. `UIManager.rubCard()`。
3. `PaiJiuTable.onClickRubCard()`。
4. `playSlideRubOpenEffect(mySeatId)`。

搓牌过程：

1. `moveCardsToCenter()` 把当前玩家两张牌移到桌面中央并放大。
2. `enablePeelRub()`：
   - 第一张牌直接 `flipToFront()`。
   - 第二张牌注册触摸事件。
   - 横向拖动距离转换为 `progress`。
3. `applyPeelProgress()`：
   - 进度小于 0.5：显示背面，压缩 scaleX。
   - 进度超过 0.5：切正面并展开。
4. 进度到 1 后移除触摸监听。
5. `returnCenterCardsToSeat()` 把牌移回座位手牌区。

### 单张牌翻面

`PaiJiuCard.flipToFront()`：

1. 停止当前 Tween。
2. `scaleX` 缩到 `0.05`。
3. 调 `showFront()`。
4. `scaleX` 恢复到 `1`。
5. 调用完成回调。

## 8. 倒计时流程

入口：`CountDownManager.show(seconds)`。

使用场景：

- 抢庄倒计时：`ClientRoomManager.grabBankerStart()`。
- 下注倒计时：`ClientRoomManager.grabBankerEnd()`。

流程：

1. `GameRes.preload()` 加载 `BetCountdown` prefab。
2. `GameRes.preload()` 调用 `CountDownManager.init(clockCountdownPrefab)`。
3. 需要倒计时时调用 `CountDownManager.show(leftSeconds)`。
4. `CountDownManager` 先关闭旧倒计时，防止重复。
5. 在 `Canvas/MainLayout/Table/ClockContainer` 实例化倒计时节点。
6. 调用 `ClockCountdown.startCountdown(time, closeCallback)`。
7. `ClockCountdown` 用 `endTimeMs = Date.now() + seconds * 1000` 计算剩余秒数。
8. `update()` 每帧刷新 Label。
9. 剩余秒数小于等于 5 时触发警告音和时钟晃动。
10. 倒计时到 0 后回调 `CountDownManager.close()`。

关闭入口：

- 自己下注成功：`ClientRoomManager.selfBetOk()`。
- 进入发牌：`ClientRoomManager.dealCard()`。
- 清桌：`UIManager.clearClockContainer()`。

## 9. 玩家数据流

### 登录用户数据

1. `Login.autoLogin()` 调 `/login/guest`。
2. 成功后 `UserData.save(user)` 写入 `cc.sys.localStorage`，key 为 `user_login_data`。
3. 大厅、商店、游戏顶部栏通过 `UserData.get()` 读取本地用户。
4. 资产变化：
   - 商店购买成功：`HallUIManager.buyProduct()` 调 `UserData.updateGold()` / `updateRoomCard()`。
   - WebSocket 推送：`ClientRoomManager.userAssetUpdate()` 根据 `field` 更新金币或房卡。
5. UI 刷新：
   - 大厅顶部栏：`HallTopBar.refresh()`。
   - 商店顶部栏：`Shop.refresh()`。

### 房间玩家数据

核心持有者：`ClientRoomManager.players: Map<number, PlayerDTO>`。

数据来源：

- 进房快照：`RoomSnapshot.players`。
- 玩家进入：`PLAYER_ENTER`。
- 坐下：`SIT_DOWN_RESULT` / `PLAYER_SIT_DOWN`。
- 准备/取消准备：`READY_RESULT`、`PLAYER_READY`、`CANCEL_READY_RESULT`、`CANCEL_PLAYER_READY`。
- 抢庄结果：`GRAB_BANKER_RESULT.players`。
- 下注结果：`PLAYER_BET.players`。
- 结算：`SETTLE.players`。
- 下一局：`NEXT_ROUND.players`。

渲染链路：

1. `ClientRoomManager.updatePlayers()` 或定向更新玩家状态。
2. `ClientRoomManager.refreshAllSeatView()`。
3. 转换为 `UserInfo`。
4. `SeatManager.refreshSeat(seatId, userInfo)`。
5. `SeatComponent.setData()`。
6. `SeatComponent.updateView()` 根据 `UserState` 与 `RoomState` 显示：
   - 空座
   - 已入座
   - 未准备/已准备
   - 游戏中
   - 庄/闲
   - 输/赢/平
   - 金币与昵称

### 当前玩家座位

- `ClientRoomManager.myUserId`：当前用户 id。
- `ClientRoomManager.mySeatId`：当前用户座位。
- 坐下或快照渲染后调用 `updateMySeatId()`。
- 是否可下注由 `canBet()` 判断：
  - 房间状态是 `BET`
  - 自己已入座
  - 已有庄家
  - 自己不是庄家

## 10. 每个 Manager 作用

| Manager | 位置 | 作用 |
| --- | --- | --- |
| `HallUIManager` | `assets/scripts/hall/HallUIManager.ts` | 大厅总控，管理大厅节点、游戏卡片、房间弹窗、WebSocket 连接、商店、战绩、购买。 |
| `CameCardComponentManager` | `assets/scripts/hall/CameCardComponentManager.ts` | 保存大厅游戏卡片组件列表和卡片数据列表。 |
| `ClientRoomManager` | `assets/scripts/game/pj/room/ClientRoomManager.ts` | 游戏房间核心状态机，接收服务端推送，维护玩家/座位/房间状态，驱动 UI、座位、发牌、结算流程。 |
| `UIManager` | `assets/scripts/game/pj/ui/UIManager.ts` | 游戏场景 UI 总控，实例化和控制顶部栏、下注、抢庄、看牌、准备按钮，提供清桌和动画入口。 |
| `SeatManager` | `assets/scripts/game/pj/seat/SeatManager.ts` | 座位布局初始化与座位点击处理，负责发送坐下请求和刷新单个座位。 |
| `SeatComponentManager` | `assets/scripts/game/pj/seat/SeatComponentManager.ts` | 缓存座位组件列表和座位数据列表，供刷新座位时查找。 |
| `CurrUserManager` | `assets/scripts/game/pj/user/CurrUserManager.ts` | 当前用户读取工具，从 `UserData` 取用户 id 和用户对象。 |
| `CountDownManager` | `assets/scripts/common/CountDownManager.ts` | 倒计时全局入口，控制倒计时 prefab 的实例化、复用和关闭。 |
| `SettleManager` | `assets/scripts/common/SettleManager.ts` | 结算弹窗全局入口，控制结算 prefab 的实例化和关闭。 |
| `ToastManager` | `assets/scripts/common/ToastManager.ts` | Toast 全局入口，动态加载 Toast prefab 并显示提示。 |
| `MouseCursorManager` | `assets/scripts/common/MouseCursorManager.ts` | 自定义鼠标光标管理。 |

资源类虽然不叫 Manager，但承担资源管理职责：

| 类 | 位置 | 作用 |
| --- | --- | --- |
| `LoginRes` | `assets/scripts/login/LoginRes.ts` | 登录/公共资源加载。 |
| `HallRes` | `assets/scripts/hall/HallRes.ts` | 大厅 bundle 资源加载与缓存。 |
| `GameRes` | `assets/scripts/game/pj/GameRes.ts` | 游戏 bundle 资源加载与缓存。 |
| `ShopRes` | `assets/scripts/shop/ShopRes.ts` | 商店 bundle 资源加载与缓存。 |

## 补充：整体启动链路

```text
loading.fire
  -> Loading.startLoad()
  -> LoginRes.preload()
  -> HallRes.preload()
  -> GameRes.preload()
  -> SceneUtil.loadScene("login")

login.fire
  -> Login.autoLogin()
  -> Http.post("/login/guest")
  -> UserData.save()
  -> SceneUtil.loadScene("hall")

hall.fire
  -> HallUIManager.init()
  -> WsClient.connectAsync()
  -> ROOM_INFO
  -> 用户选择进房方式
  -> ENTER_ROOM_RESULT / ROOM_INFO_RESULT
  -> ClientRoomManager.applyEnterRoom()
  -> SceneUtil.loadScene("game_1")

game_1.fire
  -> Game.start()
  -> SeatManager.init()
  -> ClientRoomManager.onGameSceneReady()
  -> renderRoom()
  -> 等待服务端 GAME_START / GRAB_BANKER_START / BET / DEAL_CARD / SETTLE / NEXT_ROUND
```
