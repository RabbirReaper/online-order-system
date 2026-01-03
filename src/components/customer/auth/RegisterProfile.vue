<template>
  <div class="main-container">
    <!-- 頂部導航欄 -->
    <div class="nav-container">
      <div class="nav-wrapper">
        <nav class="navbar navbar-light">
          <div class="container-fluid px-3">
            <a class="navbar-brand" href="#" @click.prevent="goBack">
              <i class="bi bi-arrow-left me-2"></i>返回
            </a>
            <div class="navbar-title">完成註冊</div>
            <div class="nav-placeholder"></div>
          </div>
        </nav>
        <div class="nav-border"></div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="auth-card">
        <div class="mb-4 text-center">
          <h5 class="mb-2">設定您的帳號</h5>
          <p class="text-muted">請填寫以下資料以完成註冊</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- 姓名 -->
          <div class="mb-3">
            <label for="name" class="form-label">姓名 <span class="text-danger">*</span></label>
            <input
              type="text"
              class="form-control"
              id="name"
              v-model="userData.name"
              :class="{ 'is-invalid': fieldErrors.name, 'is-valid': isFieldValid('name') }"
              placeholder="請輸入您的姓名"
              required
              @blur="validateField('name')"
              @input="clearFieldError('name')"
            />
            <div class="invalid-feedback">
              {{ fieldErrors.name }}
            </div>
          </div>

          <!-- 密碼 -->
          <div class="mb-3">
            <label for="password" class="form-label">密碼 <span class="text-danger">*</span></label>
            <div class="input-group">
              <input
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                id="password"
                v-model="userData.password"
                :class="{
                  'is-invalid': fieldErrors.password,
                  'is-valid': isFieldValid('password'),
                }"
                placeholder="請設置密碼"
                required
                @blur="validateField('password')"
                @input="clearFieldError('password')"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="togglePasswordVisibility"
              >
                <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.password }}
              </div>
            </div>
            <small class="form-text text-muted">密碼需6-32位，只能包含英文數字及!@#$%^&*</small>
          </div>

          <!-- 確認密碼 -->
          <div class="mb-4">
            <label for="confirmPassword" class="form-label"
              >確認密碼 <span class="text-danger">*</span></label
            >
            <div class="input-group">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                class="form-control"
                id="confirmPassword"
                v-model="confirmPassword"
                :class="{
                  'is-invalid': fieldErrors.confirmPassword,
                  'is-valid': isFieldValid('confirmPassword'),
                }"
                placeholder="請再次輸入密碼"
                required
                @blur="validateField('confirmPassword')"
                @input="clearFieldError('confirmPassword')"
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="toggleConfirmPasswordVisibility"
              >
                <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
              </button>
              <div class="invalid-feedback">
                {{ fieldErrors.confirmPassword }}
              </div>
            </div>
          </div>

          <!-- 同意條款 -->
          <div class="mb-4 form-check">
            <input
              class="form-check-input"
              type="checkbox"
              id="agreeTerms"
              v-model="agreeTerms"
              :class="{ 'is-invalid': fieldErrors.agreeTerms }"
              @change="validateField('agreeTerms')"
              required
            />
            <label class="form-check-label" for="agreeTerms">
              我已閱讀並同意 <a href="#" @click.prevent="showTerms">用戶服務條款</a> 和
              <a href="#" @click.prevent="showPrivacyPolicy">隱私政策</a>
            </label>
            <div class="invalid-feedback">
              {{ fieldErrors.agreeTerms }}
            </div>
          </div>

          <BAlert :show="formErrors.length > 0" variant="danger" class="mb-3">
            <div v-for="error in formErrors" :key="error" class="mb-1 last:mb-0">
              {{ error }}
            </div>
          </BAlert>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary py-2" :disabled="isLoading">
              <span
                v-if="isLoading"
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              完成註冊
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- 註冊成功模態框 -->
  <BModal
    id="successModal"
    title="註冊成功"
    ok-title="立即登入"
    ok-variant="success"
    hide-header-close
    no-close-on-backdrop
    no-close-on-esc
    @ok="redirectToLogin"
    ref="successModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
    </div>
    <h5 class="text-center mb-3">恭喜您完成註冊！</h5>
    <p class="text-center">您的帳號已成功建立，請立即登入開始使用我們的服務。</p>
    <div class="alert alert-success">
      <i class="bi bi-info-circle-fill me-2"></i>
      您的會員資料已成功儲存，您可以在登入後隨時查看或修改。
    </div>
  </BModal>

  <!-- 錯誤訊息模態框 -->
  <BModal
    id="errorModal"
    title="註冊失敗"
    ok-title="確認"
    ok-variant="danger"
    @ok="closeErrorModal"
    ref="errorModal"
  >
    <div class="text-center mb-3">
      <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem"></i>
    </div>
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorModalMessage }}
    </div>
  </BModal>

  <!-- 用戶服務條款模態框 -->
  <BModal id="termsModal" title="用戶服務條款" ok-title="確認" ok-only size="lg" ref="termsModal">
    <div class="modal-content-wrapper">
      <p class="text-muted mb-4">
        光速點餐股份有限公司（以下簡稱「本公司」）係依據 光速點餐
        服務條款（以下簡稱「本服務條款」），提供餐廳會員資料建置及媒合餐廳與消費者間之線上點餐服務（以下簡稱「本服務」）。
      </p>

      <h6>一、認知與接受條款</h6>
      <ul>
        <li>
          當您使用本服務，即表示您已閱讀、瞭解並同意本服務條款之所有內容，若您違反本服務條款時，本公司得隨時依據相關規則暫停或終止您使用本服務。
        </li>
        <li>
          本公司有權於任何時間修改、變更本服務條款之內容或暫停、終止本服務，且毋須另行通知。本服務條款一旦發生變動，本公司將在本站之網頁上公佈修改內容，建議您隨時注意該等修改或變更。
        </li>
        <li>
          若您是民法定義中之無行為能力人或限制行為能力人，於使用本服務前請務必讓您的法定代理人閱讀、瞭解並同意本服務條款之所有內容及其後之修改與變更後，方得使用或繼續使用本服務。
        </li>
        <li>
          若您不同意本服務條款之內容及或不同意本公司得隨時修改之，又或者您所屬的國家或地域排除本服務條款內容之全部或一部時，請您立即停止使用本服務。
        </li>
        <li>
          您一經註冊或使用本服務即視為對本服務條款的充分理解和接受，如有違反本服務條款而導致任何法律後果的發生，您將自行承擔相關之法律責任。
        </li>
      </ul>

      <h6>二、本服務註冊說明</h6>
      <p>
        您有時可以在未註冊會員帳戶的情況下使用本服務（視餐廳規定），但您將無法使用會員相關功能（例如查詢消費記錄）。若您選擇註冊會員帳戶，則帳戶註冊完成時，視為您同意下列事項：
      </p>
      <ul>
        <li>
          加入一般會員，您必須年滿20歲，具有民法上完全行為能力，願提供您的電子信箱及個人所有之台灣境內手機門號，且提供之資料均為真實、有效、完整。
        </li>
        <li>
          若您提供任何錯誤、虛假、失效、不完整的資料或違反本協議任一約定時，本公司得隨時終止全部服務，並暫停、終止或刪除您註冊之帳戶，並拒絕您再次或繼續使用本服務部份或全部功能。
        </li>
        <li>
          前項情形，本公司不負擔任何責任，您需自行負擔因此所產生的直接或間接的任何支出或損失。
        </li>
        <li>
          若因您未及時更新資料，導致本服務無法提供或提供時發生任何錯誤，您不得將此作為取消交易或拒絕付款的理由，本公司亦不承擔任何責任，您將承擔因此產生的一切後果。
        </li>
      </ul>

      <h6>三、本服務使用規範</h6>
      <ul>
        <li>
          本服務會將您提供之手機門號視為會員帳號。若您曾在任一家使用本服務之餐廳店面註冊會員並提供手機門號，則您以相同手機門號於線上註冊會員時，本服務會自動將餐廳店面會員及線上會員資料整合。
        </li>
        <li>
          當您以會員帳號使用本服務時，可以透過本服務申請成為特定使用本服務之餐廳的註冊會員。本公司將依照隱私權條款，將您的個人資料提供給該特定之餐廳或第三人。
        </li>
        <li>
          當您以會員帳號使用本服務、並成為特定使用本服務之餐廳的註冊會員時，您可透過本服務參與該餐廳自行舉辦之會員優惠活動、會員點數集兌點活動，查詢個人會員帳號在該特定餐廳的線上消費記錄與會員點數紀錄，並同意接收該餐廳以電話簡訊或電子郵件所提供的優惠訊息。
        </li>
        <li>
          您可以隨時以電子郵件通知本公司退出會員、刪除帳號及刪除個人資料。但請注意，您將同時退出所有使用本服務之所有餐廳會員，無論餐廳店面或線上會員所累積之點數、優惠、消費紀錄、點數紀錄都會消失。
        </li>
        <li>
          您也可以隨時以電子郵件通知本公司退出特定餐廳之會員，但請注意，您於該特定餐廳店面及線上會員所累積之點數、優惠、消費紀錄、點數紀錄都會消失。
        </li>
        <li>
          您應該妥善保管帳號及密碼，以同一使用者帳號和密碼使用本程式之行為，均視為您本人之行為。
        </li>
      </ul>

      <h6>四、使用者義務</h6>
      <ul>
        <li>
          您透過使用本服務所進行之契約行為，應由您本人承擔所有相關權利義務。若因使用本服務而產生您與任何第三方（包括但不限於餐廳與發卡銀行業者）之糾紛，本公司僅於必要範圍內提供相關交易資料以供佐證，但不負擔任何連帶賠償責任。
        </li>
        <li>
          您保證不得以任何非法目的或方式使用本服務，並承諾遵守中華民國相關法規及一切使用網際網路之國際慣例，並保證不得利用本服務從事任何侵害他人權益或違法之行為，如有違反，應由您自行負擔相關法律責任，而與本公司無涉，若因而致本公司受有損失，本公司並得向您請求損害賠償（包括但不限於律師費用與訴訟費用）。
        </li>
        <li>
          您應保證您提供、上傳、刊登或任何其他方式傳送的文字、影音檔、圖形、照片或其他資料，絕無違反法令規定或侵害第三人權利之情事。如有違反，由您自行負擔相關法律責任，而與本公司無涉，若因而致本公司受有損失，本公司並得向您請求損害賠償（包括但不限於律師費用與訴訟費用）。
        </li>
        <li>若您有違反前兩項約定之情事，本公司得逕行撤下該涉嫌違法或侵權之內容或相關資訊。</li>
      </ul>

      <h6>五、責任限制</h6>
      <ul>
        <li>
          本公司僅依現時之功能及現況提供您使用本服務，本公司不保證本服務一定符合您的期待，本公司並保留隨時修改各項服務功能之全部或一部之權利。
        </li>
        <li>
          本公司有權於任何時間暫時或永久修改或終止本服務（或其任何部分），而無論其通知與否，您同意對於本服務所作的任何修改、暫停或終止，本公司對您和任何第三人均無需承擔任何責任。
        </li>
        <li>
          本服務顯示本公司商標或識別標誌（iCHEF），或網站域名包含iCHEF，均並不代表本公司對該餐廳有實際的審查、稽核或有相當的了解，本公司不對餐廳負擔任何擔保責任。如有發生任何爭議，包含但不限於訂單、餐點、費用、優惠、會員點數等事項，其所產生的法律責任應由餐廳承擔，本公司恕不負任何責任。
        </li>
        <li>
          本公司不保證餐廳所上傳或刊載之訊息，其內容或傳輸過程均係真實、可靠且正確無誤，亦不保證系統穩定絕無中斷之情事，您應自行隨時確認您所上傳或刊載之訊息是否正確、並自行採取備份存檔等保護措施。本公司對於您使用或無法使用本服務而造成之損害均不負賠償責任。
        </li>
        <li>
          您了解本公司未對餐廳加以任何事先審查，對餐廳的行為亦無法進行全面控制，您使用本服務時，包括本服務內容之正確性、完整性或實用性時，您同意將自行加以判斷並承擔所有風險，而不依賴於本公司。
        </li>
        <li>
          本服務可能會提供連結至其他外部連結，您可能因此連結其他業者經營或銷售之網站，惟不代表本公司與該等業者有任何關係，本公司不控制且不對第三方網站的內容、隱私政策與行為承擔責任。若您因使用或依賴任何此類網站或資源發佈的或經由此類網站或資源獲得的任何內容、商品或服務所產生的任何損害或損失，概由您自行負責，本公司不負任何直接或間接之責任。
        </li>
      </ul>

      <h6>六、AI 生成內容免責聲明</h6>
      <ul>
        <li>
          您使用的服務可能包含人工智慧（AI）功能，對於人工智慧（AI）技術自動生成的翻譯、文字或其他內容，本公司不保證該自動生成內容的正確性、完整性、即時性、適用性或符合使用者特定需求。
        </li>
        <li>
          您應注意，人工智慧（AI）生成的內容可能涉及第三方的著作權或其他智慧財產權，並且在使用這些內容時，應遵守相關的智慧財產權法律及規範，您對於內容的合法使用負有完全責任。
        </li>
        <li>
          本公司保留隨時更新、修改、暫停或終止本服務及其中人工智慧（AI）功能的權利，無須事先通知，本公司不因此而承擔任何責任。
        </li>
      </ul>

      <h6>七、個人資料蒐集、處理及利用之告知</h6>
      <p>
        您提供的登記資料及本站保留之相關個人資料，將受到我國相關法律（包括但不限於個人資料保護法）和本站《隱私權政策》之規範。
      </p>

      <h6>八、服務暫停或中斷</h6>
      <p>
        本服務系統或功能例行性之維護、改置或變動所發生之服務暫停或中斷，本公司得於該暫停或中斷前以公告或其他適當之方式告知，本公司不需因此負任何損害賠償責任。在下列情形，將暫停或中斷全部或一部份之服務，且對使用者任何直接或間接之損害，均不負任何責任：
      </p>
      <ul>
        <li>本服務相關軟硬體設備進行搬遷、更換、升級、保養或維修時。</li>
        <li>使用者有任何違反政府法令或本服務條款情形。</li>
        <li>天災或其他不可抗力所致之服務停止或中斷。</li>
        <li>任何不可歸責於本服務之事由所致之網站服務停止或中斷。</li>
      </ul>

      <h6>九、智慧財產權</h6>
      <p>
        本站所使用之軟體或程式、網站上所有內容，包括但不限於著作、圖片、檔案、資訊、資料、網站架構、網站畫面的安排、網頁設計，均由本公司或其他權利人依法擁有其智慧財產權，包括但不限於商標權、專利權、著作權、營業秘密等。任何人不得逕自使用、修改、重製、公開播送、改作、散布、發行、公開發表、進行還原工程、解編或反向組譯。若您欲引用或轉載前述軟體、程式或網站內容，必須依法取得本站或其他權利人的事前書面同意。如有違反前述規定，您應對本公司負損害賠償責任（包括但不限於訴訟費用及律師費用等）。
      </p>

      <h6>十、通知</h6>
      <ul>
        <li>
          本服務條款及任何其他的協議、告示或其他關於您使用本服務帳戶及服務的通知，您同意本公司使用電子方式通知您，例如：電子郵件、於本網站或者合作網站上公佈、手機簡訊通知等。您同意本公司以電子方式發出前述通知之日視為通知已送達。因資訊傳輸等原因導致您未在前述通知發出當日收到該等通知者，本公司不負擔任何責任。
        </li>
        <li>
          本公司向您發出的通知可經由本站公告、電子郵件或郵局普通郵件等方式為之。本服務條款或其他事項有所變更時，本公司將在本站網頁上公佈修改服務內容，而不另行通知亦不另行公告。
        </li>
      </ul>

      <h6>十一、準據法及管轄權</h6>
      <p>
        本服務條款解釋、補充及適用，悉依中華民國法令為準據法。因本條款所發生之訴訟，以臺灣臺北地方法院為第一審管轄法院。
      </p>

      <div class="text-muted text-center mt-4 pt-3 border-top">
        <small>本服務條款最後更新於 2026 年 1 月 1 日</small>
      </div>
    </div>
  </BModal>

  <!-- 隱私政策模態框 -->
  <BModal id="privacyModal" title="隱私政策" ok-title="確認" ok-only size="lg" ref="privacyModal">
    <div class="modal-content-wrapper">
      <p class="text-muted mb-4">
        本隱私權政策，適用於光速點餐股份有限公司（下稱「本公司」）於餐廳會員及線上點餐提供之服務（下稱「本服務」）。
        依照個人資料保護法第8條規定，本隱私權政策將幫助您了解，我們如何蒐集、處理、利用及保護個人資料，請詳閱以下內容：
        您同意並接受本隱私權政策，並且您得隨時撤回您的同意。
      </p>

      <h6>一、個人資料</h6>
      <p>
        個人資料係指具個人可辨認性的資訊、例如姓名、使用者名稱、密碼、地址、郵件地址、電話號碼等非公開之資料（以下簡稱「個人資料」）。
        我們蒐集個人資料以提供更優質的服務給使用者。
      </p>
      <p>
        上述特定目的，法定編號包含：○六九 契約、類似契約或其他法律關係事務、○七七
        訂位、住宿登記與購票業務、○八一 個人資料之合法交易業務、〇九〇
        消費者、客戶管理與服務、〇九一 消費者保護、〇九八商業與技術資訊、一三五
        資（通）訊服務、一三六 資（通）訊與資料庫管理、一五二 廣告或商業行為管理、一五七
        調查、統計與研究分析、一八一 其他經營合於營業登記項目或組織章程所定之業務。
      </p>
      <p>
        使用者可能會被要求提供個人資料，包括但不限於當使用者光臨我們的程式、於程式註冊、以及我們程式連結之其他活動、服務、特徵或資源時。然而，使用者可能匿名光臨程式。我們僅在使用者自願提供予我們時蒐集個人資料。然而，如果使用者拒絕提供個人資料，使用者可能將無法接觸特定程式相關活動。我們會蒐集不同的個人資料以用於下列服務：
      </p>
      <ul>
        <li>會員註冊：姓名、電話號碼、生日。</li>
        <li>線上訂購餐點：姓名、地址、電話號碼、信用卡卡號。</li>
        <li>有關服務的研究及分析。</li>
        <li>個人化體驗。</li>
        <li>追蹤服務。</li>
        <li>廣告、推廣服務：地址、電子郵件地址、電話號碼。</li>
        <li>障礙排除。</li>
        <li>
          其他服務或活動，例如特別行銷或競賽活動：姓名、電子郵件地址、生日和其他與本公司行銷目的相關之資訊。
        </li>
      </ul>

      <h6>二、非個人資料</h6>
      <p>
        我們可能會於使用者在程式互動過程中，蒐集使用者不具個人可辨識性的資料。不具個人可辨識性資料係指無法辨識到使用者本身之資料，包括但不限於使用者於瀏覽器上之使用者名稱、使用者連結我們程式之電腦類型和技術資訊，如作業系統和網路服務提供者與其他類似資訊。
      </p>

      <h6>三、cookies及遠端蒐集</h6>
      <p>
        我們及與我們合作的第三方可能使用cookies及遠端蒐集。特定資料可能會被蒐集,如網際網路協定位址、設備事件資訊包括但不限於瀏覽器類型、當機或閃退記錄、系統活動和其他伺服器登入資料。我們的程式可能會使用cookies來提升使用者體驗。使用者的網頁瀏覽器會在硬碟置入cookies用來記錄瀏覽記錄以及有時用來追蹤使用資訊。使用者可以選擇關閉cookies或設定瀏覽器於cookies傳送時將提醒您。然請注意當網頁瀏覽器設定拒絕cookies時，程式上之部分功能可能無法順利運作。
      </p>

      <h6>四、以下第三方可能接收您的資料</h6>
      <ul>
        <li>第三方軟體：包括但不限於 Uber Eats、foodpanda、LINE Pay 與藍新金流。</li>
        <li>關係企業：我們可能與母公司、子公司或其他關係企業分享您提供或與您有關的資料。</li>
        <li>餐廳：任何使用本服務建置會員資料或提供線上點餐之餐廳。</li>
        <li>
          AWS：本服務使用Amazon.com, Inc提供的元件。本公司可能將您的個人資料，透過AWS資料庫儲存。
        </li>
      </ul>

      <h6>五、我們如何運作及使用蒐集的資訊</h6>
      <p>
        本公司在符合下列特定目的（以下簡稱「目的」）之特定範圍與期間內可能以電子郵件、電話或其他合理合法方式傳送或使用使用者之個人資料。
      </p>
      <p>
        <strong>與使用者溝通：</strong
        >當使用者在程式上提交或詢問任何意見，我們將透過其提供之聯絡資訊回覆使用者。
      </p>
      <p>
        <strong>個人化使用者體驗：</strong
        >我們可能整合使用者資料，以瞭解我們的使用者如何使用我們程式提供的服務和資源。
      </p>
      <p>
        <strong>管理程式上之任何特殊活動：</strong
        >若使用者於程式上參與抽獎、競賽、問卷訪談、促銷等相關活動，我們可能會用使用者提供之資料以管理或進行該活動。
      </p>

      <h6>六、我們如何保護您的資料</h6>
      <p>
        我們採取適當的資料保護、儲存和處理機制及資料安全措施，以避免未經授權之接觸、變更、揭露或破壞您的個人資料、交易資訊與於我們程式處理及儲存之資料。
      </p>

      <h6>七、資料分享與揭露</h6>
      <p>
        我們不會與任何第三人出售、交易或出租使用者之個人資料。我們可能揭露、出售、交易或出租通用性且經整合的統計資訊，此統計資訊包含但不限於應用程式名稱、安裝/卸載之時間日期及場域（國家）等，未連結至任何個人資訊之統計資訊。若您不希望您的資訊可能以上開方式分享者，請透過
        consumer@ichef.com.tw 聯繫我們。
      </p>

      <h6>八、變更</h6>
      <p>
        為因應時勢變遷或法令修正等事由，我們有權於任何時間修改或變更本政策之內容，您應經常查看以瞭解您當前的權利及義務，但我們不會在未取得您明確同意的情況下，逕自縮減本政策賦予您的權利。如果本政策有重大異動，我們會提供更明顯的通知
        (例如以電子郵件通知政策異動)。您須同意接受本政策之修改及變更，才能在本我們修改或變更本政策後仍繼續使用本服務。
      </p>

      <h6>九、廣告</h6>
      <p>
        我們的程式可能出現第三方廣告業者之廣告，並傳送給有設置 cookies 的使用者。這些 cookies
        允許廣告業者之伺服器每次寄送線上廣告給您時得以辨認您的電腦，以及編輯您或任何使用您的電腦者之非個人資料。這些資料使廣告業者可傳送那些他們確信您將會有興趣之特定性廣告。本隱私政策未包含使用
        cookies 或這些廣告業者之任何行為。
      </p>

      <h6>十、第三方程式或網站</h6>
      <p>
        本服務包含連結至第三方的程式、網站、產品及服務。我們的產品與服務亦可能使用或提供來自於其他第三方產品與服務之提供。本隱私政策並不適用該第三方程式或網站等，但我們鼓勵使用者去檢視那些第三方程式或網站等隱私政策。
      </p>

      <h6>十一、我們隱私權政策的更新</h6>
      <p>
        我們會定期檢視我們的隱私權政策及遵循之情況。我們的隱私權政策可能隨著時間而更動。如果有任何變動，我們將於網頁上更新我們的隱私權政策，且相關資料之變動將會公告。我們鼓勵使用者經常檢視本網頁。同時，您應瞭解且同意您有責任定期檢閱本隱私政策。
      </p>

      <h6>十二、您對於隱私權政策之同意</h6>
      <p>
        如您欲撤回隱私權政策之同意或拒絕提供您的個人資料，您可以停止使用本服務，並透過
        consumer@ichef.com.tw 聯繫我們。但我們可能會於法定必要範圍內，保留您的個人資料。
      </p>
      <p>
        請注意，您撤回隱私權政策之同意時，已支付與本公司之款項將不得請求退還，且無法繼續使用本服務。
      </p>

      <h6>十三、有關您的隱私保證</h6>
      <p>
        為了確保您資料的安全性以及隱私權政策之實施，我們會向我們的員工宣導我們的這些政策、規範及管理監控。
      </p>

      <h6>十四、您的權利</h6>
      <p>
        我們尊重您提供的個人資料。關於您所提供予我們的個人資料，您可以透過聯繫本公司客戶服務行使下列權利:
      </p>
      <ul>
        <li>查詢或請求閱覽您的個人資料。</li>
        <li>請求提供給您的個人資料複製本。</li>
        <li>請求補充或更正您的個人資料。</li>
        <li>請求停止蒐集、處理或利用您的個人資料。</li>
        <li>請求刪除您的個人資料。</li>
      </ul>

      <h6>十五、聯繫我們</h6>
      <p>
        如果您對隱私權政策有任何疑問、或關於資料傳送、任何本服務運作等事項，請透過下列網頁聯繫我們
        rabbirorder.com。
      </p>

      <div class="text-muted text-center mt-4 pt-3 border-top">
        <small>本隱私政策最後更新於 2026 年 1 月 1 日</small>
      </div>
    </div>
  </BModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BModal, BAlert } from 'bootstrap-vue-next'
import api from '@/api'

const router = useRouter()

const successModal = ref(null)
const errorModal = ref(null)
const termsModal = ref(null)
const privacyModal = ref(null)

const phone = ref('')
const verificationCode = ref('')
const userData = reactive({
  name: '',
  password: '',
})
const confirmPassword = ref('')
const agreeTerms = ref(false)

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const fieldErrors = reactive({})
const touchedFields = reactive({})
const formErrors = ref([])
const errorModalMessage = ref('')

const brandId = computed(() => {
  return sessionStorage.getItem('currentBrandId')
})

const validationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 25,
    message: '姓名長度必須1-25個字元',
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9!@#$%^&*]+$/,
    message: '密碼必須6-32個字元，只能包含英文、數字和符號 !@#$%^&*',
  },
  confirmPassword: {
    required: true,
    match: 'password',
    message: '確認密碼與密碼不相符',
  },
  agreeTerms: {
    required: true,
    message: '請同意服務條款和隱私政策',
  },
}

const validateField = (fieldName) => {
  touchedFields[fieldName] = true
  const rule = validationRules[fieldName]
  if (!rule) return true

  let value
  if (fieldName === 'confirmPassword') {
    value = confirmPassword.value
  } else if (fieldName === 'agreeTerms') {
    value = agreeTerms.value
  } else {
    value = userData[fieldName]
  }

  if (rule.required) {
    if (fieldName === 'agreeTerms') {
      if (!value) {
        fieldErrors[fieldName] = rule.message
        return false
      }
    } else if (!value || value.trim() === '') {
      fieldErrors[fieldName] = rule.message
      return false
    }
  }

  if (!rule.required && (!value || value.trim() === '')) {
    delete fieldErrors[fieldName]
    return true
  }

  if (rule.minLength && value.length < rule.minLength) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  if (rule.pattern && !rule.pattern.test(value)) {
    fieldErrors[fieldName] = rule.message
    return false
  }

  if (rule.match) {
    const matchValue = userData[rule.match]
    if (value !== matchValue) {
      fieldErrors[fieldName] = rule.message
      return false
    }
  }

  delete fieldErrors[fieldName]
  return true
}

const clearFieldError = (fieldName) => {
  delete fieldErrors[fieldName]
  formErrors.value = []
}

const isFieldValid = (fieldName) => {
  return touchedFields[fieldName] && !fieldErrors[fieldName] && userData[fieldName]
}

const validateForm = () => {
  let isValid = true
  const fieldsToValidate = ['name', 'password', 'confirmPassword', 'agreeTerms']

  fieldsToValidate.forEach((field) => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  return isValid
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const showTerms = () => {
  if (termsModal.value) {
    termsModal.value.show()
  }
}

const showPrivacyPolicy = () => {
  if (privacyModal.value) {
    privacyModal.value.show()
  }
}

const handleSubmit = async () => {
  try {
    formErrors.value = []

    if (!validateForm()) {
      formErrors.value = ['請檢查並修正表單中的錯誤']
      return
    }

    if (!brandId.value) {
      formErrors.value = ['無法獲取品牌資訊']
      return
    }

    if (!phone.value || !verificationCode.value) {
      formErrors.value = ['註冊資訊不完整，請重新開始註冊流程']
      return
    }

    isLoading.value = true

    const response = await api.userAuth.register({
      brandId: brandId.value,
      userData: {
        name: userData.name,
        phone: phone.value.replace(/[\s\-\(\)]/g, ''),
        password: userData.password,
        brand: brandId.value,
      },
      code: verificationCode.value,
    })

    console.log('註冊成功:', response)

    sessionStorage.removeItem('registerPhone')
    sessionStorage.removeItem('registerVerificationCode')
    sessionStorage.removeItem('registerTimestamp')

    if (successModal.value) {
      successModal.value.show()
    } else {
      redirectToLogin()
    }
  } catch (error) {
    console.error('註冊失敗:', error)

    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      errorModalMessage.value = error.response.data.errors.join('\n')
    } else if (error.response?.data?.message) {
      errorModalMessage.value = error.response.data.message
    } else if (error.response?.status === 400) {
      const errorMsg = error.response.data.message
      if (errorMsg?.includes('驗證碼')) {
        errorModalMessage.value = '驗證碼錯誤或已過期，請重新開始註冊流程'
      } else if (errorMsg?.includes('手機號碼')) {
        errorModalMessage.value = '該手機號碼已被註冊，請使用其他號碼或前往登入'
      } else {
        errorModalMessage.value = errorMsg || '註冊失敗，請檢查您的資料'
      }
    } else if (error.response?.status === 429) {
      errorModalMessage.value = '操作過於頻繁，請稍後再試'
    } else {
      errorModalMessage.value = '註冊失敗，請檢查網路連線後再試'
    }

    if (errorModal.value) {
      errorModal.value.show()
    }
  } finally {
    isLoading.value = false
  }
}

const redirectToLogin = () => {
  router.push({
    path: '/auth/login',
    query: { phone: phone.value, registered: 'true' },
  })
}

const goBack = () => {
  router.push('/auth/register/verify')
}

const closeErrorModal = () => {}

onMounted(() => {
  const storedPhone = sessionStorage.getItem('registerPhone')
  const storedCode = sessionStorage.getItem('registerVerificationCode')

  if (!storedPhone || !storedCode) {
    router.push('/auth/register')
    return
  }

  phone.value = storedPhone
  verificationCode.value = storedCode
})
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.nav-container {
  position: fixed;
  top: 0;
  width: 100%;
  max-width: 736px;
  z-index: 1030;
  left: 50%;
  transform: translateX(-50%);
}

.nav-wrapper {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 0;
  padding: 0.8rem 1rem;
}

.navbar-brand {
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.navbar-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.nav-placeholder {
  width: 30px;
}

.nav-border {
  height: 3px;
  background: linear-gradient(to right, #d35400, #e67e22);
  width: 100%;
}

.content-wrapper {
  width: 100%;
  max-width: 736px;
  margin: 0 auto;
  padding: 80px 15px 30px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.auth-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.btn-primary {
  background-color: #d35400;
  border-color: #d35400;
  font-weight: 500;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #e67e22;
  border-color: #e67e22;
}

.form-check-input:checked {
  background-color: #d35400;
  border-color: #d35400;
}

.form-control.is-valid {
  border-color: #198754;
}

.form-control.is-invalid,
.form-check-input.is-invalid {
  border-color: #dc3545;
}

.input-group .form-control.is-invalid {
  border-right: 1px solid #dc3545;
}

.input-group .form-control.is-valid {
  border-right: 1px solid #198754;
}

.input-group .invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.last\:mb-0:last-child {
  margin-bottom: 0;
}

.modal-content-wrapper {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.5rem;
}

.modal-content-wrapper h5 {
  color: #d35400;
  margin-bottom: 1rem;
}

.modal-content-wrapper h6 {
  color: #333;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.modal-content-wrapper p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.modal-content-wrapper ul {
  color: #666;
  line-height: 1.6;
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.modal-content-wrapper ul li {
  margin-bottom: 0.5rem;
}

@media (max-width: 576px) {
  .content-wrapper {
    padding-top: 70px;
  }

  .auth-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;
  }
}
</style>
