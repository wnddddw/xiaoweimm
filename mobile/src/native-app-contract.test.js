const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(__dirname, '..');
const appEntry = fs.readFileSync(path.join(mobileRoot, 'App.tsx'), 'utf8');
const rootNavigator = fs.readFileSync(path.join(__dirname, 'navigation', 'RootNavigator.tsx'), 'utf8');
const toastComponent = fs.readFileSync(path.join(__dirname, 'components', 'common', 'Toast.tsx'), 'utf8');
const constants = fs.readFileSync(path.join(__dirname, 'utils', 'constants.ts'), 'utf8');
const authContext = fs.readFileSync(path.join(__dirname, 'store', 'AuthContext.tsx'), 'utf8');
const apiClient = fs.readFileSync(path.join(__dirname, 'api', 'client.ts'), 'utf8');
const authApi = fs.readFileSync(path.join(__dirname, 'api', 'auth.ts'), 'utf8');
const secureStore = fs.readFileSync(path.join(__dirname, 'utils', 'secureStore.ts'), 'utf8');
const mainNavigator = fs.readFileSync(path.join(__dirname, 'navigation', 'MainNavigator.tsx'), 'utf8');
const dealNavigator = fs.readFileSync(path.join(__dirname, 'navigation', 'DealNavigator.tsx'), 'utf8');
const buyerNavigator = fs.readFileSync(path.join(__dirname, 'navigation', 'BuyerNavigator.tsx'), 'utf8');
const sellerNavigator = fs.readFileSync(path.join(__dirname, 'navigation', 'SellerNavigator.tsx'), 'utf8');
const adminNavigator = fs.readFileSync(path.join(__dirname, 'navigation', 'AdminNavigator.tsx'), 'utf8');
const homeScreen = fs.readFileSync(path.join(__dirname, 'screens', 'home', 'HomeScreen.tsx'), 'utf8');
const dealList = fs.readFileSync(path.join(__dirname, 'screens', 'deal', 'DealList.tsx'), 'utf8');
const dealCreate = fs.readFileSync(path.join(__dirname, 'screens', 'deal', 'DealCreate.tsx'), 'utf8');
const dealDetail = fs.readFileSync(path.join(__dirname, 'screens', 'deal', 'DealDetail.tsx'), 'utf8');
const messageList = fs.readFileSync(path.join(__dirname, 'screens', 'messages', 'MessageList.tsx'), 'utf8');
const membershipScreen = fs.readFileSync(path.join(__dirname, 'screens', 'member', 'MembershipScreen.tsx'), 'utf8');
const profileScreen = fs.readFileSync(path.join(__dirname, 'screens', 'profile', 'ProfileScreen.tsx'), 'utf8');
const paymentScreen = fs.readFileSync(path.join(__dirname, 'screens', 'payment', 'PaymentScreen.tsx'), 'utf8');
const verifyScreen = fs.readFileSync(path.join(__dirname, 'screens', 'verify', 'VerifyScreen.tsx'), 'utf8');
const sellerDashboard = fs.readFileSync(path.join(__dirname, 'screens', 'seller', 'SellerDashboard.tsx'), 'utf8');
const buyerDashboard = fs.readFileSync(path.join(__dirname, 'screens', 'buyer', 'BuyerDashboard.tsx'), 'utf8');
const publicContentScreen = fs.readFileSync(path.join(__dirname, 'screens', 'public', 'PublicContentScreen.tsx'), 'utf8');
const projectPublish = fs.readFileSync(path.join(__dirname, 'screens', 'seller', 'ProjectPublish.tsx'), 'utf8');
const sellerProjectDetail = fs.readFileSync(path.join(__dirname, 'screens', 'seller', 'ProjectDetail.tsx'), 'utf8');
const demandInput = fs.readFileSync(path.join(__dirname, 'screens', 'buyer', 'DemandInput.tsx'), 'utf8');
const projectManage = fs.readFileSync(path.join(__dirname, 'screens', 'seller', 'ProjectManage.tsx'), 'utf8');
const projectBrowse = fs.readFileSync(path.join(__dirname, 'screens', 'buyer', 'ProjectBrowse.tsx'), 'utf8');
const myApplications = fs.readFileSync(path.join(__dirname, 'screens', 'buyer', 'MyApplications.tsx'), 'utf8');
const buyerProjectDetail = fs.readFileSync(path.join(__dirname, 'screens', 'buyer', 'ProjectDetail.tsx'), 'utf8');
const projectSnapshot = fs.readFileSync(path.join(__dirname, 'components', 'project', 'ProjectSnapshot.tsx'), 'utf8');
const workbenchTabs = fs.readFileSync(path.join(__dirname, 'components', 'workbench', 'WorkbenchTabs.tsx'), 'utf8');

function assert(name, condition) {
  if (!condition) {
    throw new Error(name);
  }
}

assert('App entry uses AuthProvider', /import\s+\{\s*AuthProvider\s*\}\s+from\s+['"]\.\/src\/store\/AuthContext['"]/.test(appEntry));
assert('App entry uses RootNavigator', /import\s+RootNavigator\s+from\s+['"]\.\/src\/navigation\/RootNavigator['"]/.test(appEntry));
assert('App entry does not import WebApp', !/import\s+WebApp\s+from\s+['"]\.\/src\/WebApp['"]/.test(appEntry));
assert('App entry renders RootNavigator', /<RootNavigator\s*\/>/.test(appEntry));
assert('App entry does not render WebApp', !/<WebApp\s*\/>/.test(appEntry));
assert('Root navigator uses main app shell as default entry', /<MainNavigator\s*\/>/.test(rootNavigator));
assert('Root navigator does not gate the app behind auth screens', !/isAuthenticated\s*\?\s*<MainNavigator\s*\/>\s*:\s*<AuthNavigator\s*\/>/.test(rootNavigator));
assert('Root navigator loading state shows branded startup copy', /xiaoweimm/.test(rootNavigator) && /正在启动/.test(rootNavigator));
assert('Main tabs disable native detach/freeze to avoid Android first-frame blank screen', /<Tab\.Navigator[\s\S]*detachInactiveScreens=\{false\}/.test(mainNavigator) && /freezeOnBlur:\s*false/.test(mainNavigator));
assert('Toast avoids native-driver opacity unmount blanking on Android', !/useNativeDriver:\s*true/.test(toastComponent) && /setTimeout/.test(toastComponent));
assert('Main tab navigator explicitly opens Home on first visit', /<Tab\.Navigator[\s\S]*initialRouteName="Home"/.test(mainNavigator));
assert('Home screen preserves original public landing sections', /dataMetrics/.test(homeScreen) && /serviceCards/.test(homeScreen) && /caseCards/.test(homeScreen) && /footerLinks/.test(homeScreen));
assert('Home screen mirrors index nav menu', /navMenuItems/.test(homeScreen) && /想要出售事业/.test(homeScreen) && /想要收购事业/.test(homeScreen) && /服务介绍/.test(homeScreen) && /公司简介/.test(homeScreen));
assert('Home hero mirrors index actions', /安心并购，/.test(homeScreen) && /从 xiaoweimm 开始/.test(homeScreen) && /保护中小企业，为区域经济贡献力量/.test(homeScreen));
assert('Home success cases keep index entry and descriptions', /查看全部案例/.test(homeScreen) && /经营者因无人接班/.test(homeScreen) && /汽车零部件二级供应商/.test(homeScreen) && /金融软件外包企业/.test(homeScreen));
assert('Home CTA and footer mirror index page', /开始免费咨询/.test(homeScreen) && /马上免费咨询/.test(homeScreen) && /TEL：400-888-6688/.test(homeScreen));
assert('Home public links navigate to native public content pages', /navigation\.navigate\('PublicContent'/.test(homeScreen) && /page:\s*'service'/.test(homeScreen) && /page:\s*'case'/.test(homeScreen) && /page:\s*'column'/.test(homeScreen) && /page:\s*'company'/.test(homeScreen) && /page:\s*'contact'/.test(homeScreen));
assert('Home screen includes auth modal tabs from original HTML', /authModalVisible/.test(homeScreen) && /modalMode/.test(homeScreen) && /phoneLogin/.test(homeScreen) && /passwordLogin/.test(homeScreen) && /register/.test(homeScreen));
assert('Home screen keeps seller and buyer role entrances', /handleRoleEntrance\('seller'/.test(homeScreen) && /handleRoleEntrance\('buyer'/.test(homeScreen));
assert('Home password login defers role navigation until authenticated tabs exist', /pendingRole/.test(homeScreen) && /useEffect\(\(\) => \{[\s\S]*pendingRole[\s\S]*isAuthenticated[\s\S]*user[\s\S]*navigateRole\(pendingRole\)/.test(homeScreen) && /setPendingRole\(targetRole\)/.test(homeScreen));
assert('Home authenticated role switch does not navigate to unavailable tabs', /showRoleMismatch/.test(homeScreen) && /管理员账号不支持角色切换/.test(homeScreen) && /user\?\.role\s*===\s*role/.test(homeScreen));
assert('Home validates actual user role before pending role navigation', /user\.role\s*!==\s*pendingRole/.test(homeScreen) && /showRoleMismatch\(pendingRole\)/.test(homeScreen) && /navigateRole\(pendingRole\)/.test(homeScreen));
assert('Home role entrance blocks mismatched roles before auth flow', /handleRoleEntrance/.test(homeScreen) && /isAuthenticated/.test(homeScreen) && /showRoleMismatch\(role\)/.test(homeScreen) && /handleRoleEntrance\('seller'/.test(homeScreen));
assert('Main navigator hides workbench tabs before auth', /isAuthenticated\s+&&\s+isSeller/.test(mainNavigator) && /isAuthenticated\s+&&\s+<Tab\.Screen name="Deals"/.test(mainNavigator));

assert('Production API has a concrete HTTPS base URL fallback', /PRODUCTION_API_BASE_URL\s*=\s*['"]https:\/\/[^'"]+\/api['"]/.test(constants));
assert('Production API does not throw before app startup', !/API_HOST not configured for production build/.test(constants));
assert('Development API supports physical Android device through adb reverse', /__DEV__[\s\S]*127\.0\.0\.1:3001\/api/.test(constants));
assert('Development API keeps Android emulator fallback documented', /10\.0\.2\.2:3001\/api/.test(constants));
assert('API client does not permanently block retries after a network error', !/request\.use[\s\S]*if\s*\(!isNetworkAvailable\)[\s\S]*NETWORK_OFFLINE/.test(apiClient));
assert('API client refreshes expired access tokens before clearing login state', /refreshAccessToken/.test(apiClient) && /originalRequest\._retry/.test(apiClient) && /secureStore\.setToken\(token\)/.test(apiClient) && /return api\(originalRequest\)/.test(apiClient));
assert('API client maps server errors to Chinese-safe user messages', /getApiErrorMessage/.test(apiClient) && /friendlyMessage/.test(apiClient) && /error\.message\s*=\s*\(error as any\)\.friendlyMessage/.test(apiClient));
assert('Secure store persists refresh token separately', /REFRESH_TOKEN_KEY/.test(secureStore) && /setRefreshToken/.test(secureStore) && /getRefreshToken/.test(secureStore) && /removeRefreshToken/.test(secureStore));
assert('Auth API and context preserve refresh tokens', /refresh_token:\s*string/.test(authApi) && /\/auth\/refresh/.test(authApi) && /refresh_token:\s*refreshToken/.test(authContext) && /secureStore\.setRefreshToken\(refreshToken\)/.test(authContext));

// 登录/注册已统一由 HomeScreen 内嵌弹窗完成（screens/auth、AuthNavigator、WebApp 死代码已删除）
assert('Home auth modal uses Chinese login/register copy', /手机号/.test(homeScreen) && /获取验证码/.test(homeScreen) && /手机登录/.test(homeScreen) && /密码登录/.test(homeScreen));
assert('Auth context exposes SMS login', /loginSms:\s*\(phone:\s*string,\s*code:\s*string\)\s*=>\s*Promise<void>/.test(authContext));
assert('Register call passes sms code in correct argument order', /register\(phone, code, password, name, targetRole\)/.test(homeScreen));
assert('Register modal shows sms code input like phone login', /modalMode === 'phoneLogin' \|\| modalMode === 'register'/.test(homeScreen));
assert('Home auth screens have no mojibake text', !/[锛涔骞佽鐮楠]/.test(homeScreen));

assert('Main tab navigator uses Chinese labels', /title:\s*'首页'/.test(mainNavigator) && /title:\s*'我的'/.test(mainNavigator));
assert('Buyer navigator uses Chinese titles', /收购需求/.test(buyerNavigator) && /浏览项目/.test(buyerNavigator) && /我的申请/.test(buyerNavigator) && /项目详情/.test(buyerNavigator));
assert('Seller navigator uses Chinese titles', /发布项目/.test(sellerNavigator) && /我的项目/.test(sellerNavigator) && /数据看板/.test(sellerNavigator) && /项目详情/.test(sellerNavigator));
assert('Admin navigator uses Chinese titles', /管理后台/.test(adminNavigator) && /用户管理/.test(adminNavigator));
assert('Main navigator exposes public content stack route', /PublicContentScreen/.test(mainNavigator) && /name="PublicContent"/.test(mainNavigator) && /getPublicPageTitle/.test(mainNavigator));
assert('Seller workbench opens publish page first like original HTML', /initialRouteName="ProjectPublish"/.test(sellerNavigator) && /name="ProjectPublish"[\s\S]*name="ProjectManage"[\s\S]*name="SellerDashboard"/.test(sellerNavigator));
assert('Buyer workbench opens demand page first like original HTML', /initialRouteName="DemandInput"/.test(buyerNavigator) && /name="DemandInput"[\s\S]*name="ProjectBrowse"[\s\S]*name="MyApplications"/.test(buyerNavigator));

assert('Constants use Chinese industry and deal labels', /餐饮/.test(constants) && /匹配沟通/.test(constants));
assert('Core dashboard screens use Chinese copy', /serviceCards/.test(homeScreen) && /caseCards/.test(homeScreen) && /项目状态/.test(sellerDashboard) && /智能推荐/.test(buyerDashboard));
assert('Public content screen mirrors other original HTML pages', /publicPageContent/.test(publicContentScreen) && /企业转让支援服务/.test(publicContentScreen) && /成交成功案例/.test(publicContentScreen) && /M&A・企业并购专栏/.test(publicContentScreen) && /经营理念/.test(publicContentScreen) && /免费咨询/.test(publicContentScreen));
assert('Public contact page preserves original form fields', /姓名/.test(publicContentScreen) && /电话号码/.test(publicContentScreen) && /邮箱地址/.test(publicContentScreen) && /咨询类型/.test(publicContentScreen) && /咨询内容/.test(publicContentScreen));
assert('Project publish hides transfer reason UI', !/Transfer Reason|转让原因/.test(projectPublish));
assert('Project publish requires asset rows', /请补全名称、规格、数量、年份\/单位、价格/.test(projectPublish) && /设备/.test(projectPublish) && /原料/.test(projectPublish) && /库存/.test(projectPublish));
assert('Demand input uses Chinese labels', /必填信息/.test(demandInput) && /保存需求/.test(demandInput));
assert('Native workbench preserves original sidebar sections as mobile tabs', /WorkbenchTabs/.test(projectPublish + projectManage + sellerDashboard + demandInput + projectBrowse + myApplications) && /发布项目/.test(workbenchTabs) && /收购需求/.test(workbenchTabs));
assert('Buyer browse mirrors original filter bar', /CascadePicker/.test(projectBrowse) && /全部行业/.test(projectBrowse) && /全部地区/.test(projectBrowse) && /全部预算/.test(projectBrowse) && /价格↑/.test(projectBrowse) && /清空筛选/.test(projectBrowse));
assert('Buyer demand page shows saved demand summary like original HTML', /已保存的收购需求/.test(demandInput) && /savedDemand/.test(demandInput) && /预算范围/.test(demandInput));
assert('Seller manage tabs show original status counts', /getStatusCount/.test(projectManage) && /countText/.test(projectManage) && /全部/.test(projectManage) && /审核中/.test(projectManage) && /已成交/.test(projectManage));
assert('Seller manage page has no English UI copy', !/'All'|'Online'|'Pending'|'Offline'|'Sold'|'No projects'|'Rev:'|'Price:'|'Views:'|'Offers:'|'Match:'|title="Edit"|title="Refresh"|title="Top"|'Listed'|'Delisted'|'Pinned to top'|'Load failed'|'Failed'/.test(projectManage));
assert('Buyer browse and applications pages have no English UI copy', !/'Newest'|'All'|'projects'|'No projects found'|'Rev:'|'Profit:'|'Staff:'|'Views:'|title="Apply"|'Quick apply|'Application submitted'|'No applications'|'Pending'|'Approved'|'Rejected'|'Unknown'|'Load failed'|'Failed'/.test(projectBrowse + myApplications));
assert('Deal pages have no English UI copy', !/title:\s*'Deals'|title:\s*'New Deal'|title:\s*'Deal Detail'|'Load failed'|'Complete'|'Matching'|'No deals yet'|'Advisor:'|'Auto'|'Created:'|'Fill all required fields'|'Deal created'|'Failed'|Create Deal|Project ID|Seller Name|Buyer Name|Price \(10k RMB\)|Advisor \(optional\)|Notes|Advance to Next Stage|'Timeline'|'No events yet'|'Loading\.\.\.'/.test(dealNavigator + dealList + dealCreate + dealDetail));
assert('Messages page has no English UI copy', !/'All'|'Project'|'Intents'|'NDA'|'Advisor'|'System'|'Load failed'|'Failed'|'All marked read'|'Mark all as read'|'No messages'/.test(messageList));
assert('Membership page has no English UI copy', !/Personal|Company|Enterprise VIP|View non-public projects|notification|Direct contact|Event registration|Priority matching|Dedicated advisor|API access|White-glove|Custom deal flow|Unlimited|Insufficient balance|Need|Upgraded to|Upgrade failed|Auto-renew|Current Plan|Balance:|Expires:|Upgrade Plan|Upgrade|Order History|Free/.test(membershipScreen));
assert('Profile and verification pages have no English UI copy', !/'Profile updated'|'Failed'|'Check password fields'|'Password changed'|title="Save"|title="Cancel"|Tap to edit|label="Phone"|label="Role"|label="Member"|label="Verify"|Change Password|Current password|New password|Update Password|title="Go to Verification"|title="Wallet & Payments"|title="Logout"|'Enter name'|'Upload ID card'|'Upload business license'|'Verification submitted|text="Approved"|text="Pending"|text="Rejected"|Unknown|Verification History|New Verification|Personal|Company|Full Name|Company Name|Tap to upload|Submit for Review|Review takes/.test(profileScreen + verifyScreen));
assert('Payment page has no English UI copy', !/Payment WebView state|Dev mode|Production: open payment URL|Payment WebView modal/.test(paymentScreen));
assert('Core screens have no mojibake markers', !/[鈫馃锛閿]/.test(constants + homeScreen + sellerDashboard + buyerDashboard + projectPublish + demandInput));

assert('Buyer detail mirrors original detail and apply modals', /项目详情/.test(projectSnapshot) && /行业 \/ 细分/.test(projectSnapshot) && /所在地/.test(projectSnapshot) && /利润率/.test(projectSnapshot) && /项目简介/.test(projectSnapshot) && /申请查看机密信息/.test(buyerProjectDetail) && /资金计划书/.test(buyerProjectDetail) && /事业计划书/.test(buyerProjectDetail) && /申请备注/.test(buyerProjectDetail));
assert('Buyer applications page mirrors original table columns and action', /我的申请记录/.test(myApplications) && /项目编号/.test(myApplications) && /项目信息/.test(myApplications) && /申请时间/.test(myApplications) && /状态/.test(myApplications) && /查看/.test(myApplications));
assert('Seller dashboard mirrors original stat labels', /累计项目/.test(sellerDashboard) && /总浏览量/.test(sellerDashboard) && /收到报价/.test(sellerDashboard) && /AI匹配次数/.test(sellerDashboard));
assert('Transfer reason is retained in payload only, not displayed in native UI', /transfer_reason:\s*''/.test(projectPublish) && !/转让原因/.test(projectSnapshot + buyerProjectDetail + projectManage + myApplications + sellerDashboard + buyerDashboard + homeScreen + publicContentScreen));
assert('Seller project edit mirrors original modal without transfer reason', /编辑项目/.test(sellerProjectDetail) && /行业/.test(sellerProjectDetail) && /细分行业/.test(sellerProjectDetail) && /省份/.test(sellerProjectDetail) && /城市/.test(sellerProjectDetail) && /年营收/.test(sellerProjectDetail) && /员工规模/.test(sellerProjectDetail) && /利润率/.test(sellerProjectDetail) && /转让价格/.test(sellerProjectDetail) && /项目简介/.test(sellerProjectDetail) && /取消/.test(sellerProjectDetail) && /保存/.test(sellerProjectDetail) && /transfer_reason:\s*''/.test(sellerProjectDetail) && !/转让原因/.test(sellerProjectDetail));

console.log('native app contract checks passed');
