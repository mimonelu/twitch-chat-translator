function callback () {
  // Google App ScriptのURL
  // NOTICE: 下記を参考に自身で作成したアプリのURLに差し替えること
  // SEE: https://qiita.com/tanabee/items/c79c5c28ba0537112922
  const apiUrl = 'https://script.google.com/macros/s/XXXXXXXX/exec?source=en&target=ja&text=__TEXT__'

  // チャット本文のDOMを格納するDOMセレクタ
  const containerSelector = '[data-test-selector="chat-scrollable-area__message-container"]'

  // チャット本文のDOMセレクタ
  const chatSelector = '[data-a-target="chat-message-text"]'

  // 翻訳
  function translate () {
    document.querySelectorAll(chatSelector).forEach((node) => {
      // 翻訳済みフラグの処理
      const isTranslated = node.getAttribute('data-translated') === 'true'
      if (isTranslated) {
        return
      }
      node.setAttribute('data-translated', 'true')

      // チャット本文
      const text = node.innerText.trim()

      // チャット本文のバリデーション - 空文字列ではないこと
      if (text === '') {
        return
      }

      // チャット本文のバリデーション - 半角スペースを含むこと
      // ※シングルワード対策 e.g. 'LOL' 'KEKW' 'MonkaS/W'
      if (!text.includes(' ')) {
        return
      }

      // API URL
      const url = apiUrl.replace('__TEXT__', text)

      fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      })
      .then(async (response) => {
        if (!(response?.ok)) {
          return
        }

        // レスポンスの抽出
        // NOTICE: Google App Scriptの仕様に準じる
        const json = await response.json()
        if (json.code !== 200) {
          return
        }

        // チャット本文の置換
        node.innerText = json.text

        // 原文を title 属性値として設定
        node.setAttribute('title', text)
      })
    })
  }

  // 監視
  function observe () {
    const containerNode = document.querySelector(containerSelector)
    if (!containerNode) {
      return
    }
    const mutationObserver = new MutationObserver(translate)

    // NOTICE: DOMセレクタが機能しなくなった場合、オプションを変更する必要があるかもしれない
    // SEE: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe
    mutationObserver.observe(containerNode, {
      childList: true,
      characterData: false,
      characterDataOldValue: false,
      attributes: false,
      subtree: false,
    })
  }

  translate()
  observe()
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('chrome://')) {
    return
  }
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: callback,
  })
})
