// iOS PWA Install Prompt
(function() {
    'use strict';
    
    // Check if running in standalone mode (PWA)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    
    // Show prompt only if:
    // 1. Running on iOS
    // 2. NOT in PWA mode
    // 3. Not previously dismissed (or dismissed more than 7 days ago)
    if (isIOS && !isPWA && (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000)) {
        showPWAPrompt();
    }
    
    function showPWAPrompt() {
        // Create prompt element
        const prompt = document.createElement('div');
        prompt.id = 'pwa-install-prompt';
        prompt.innerHTML = `
            <style>
                #pwa-install-prompt {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
                    z-index: 9999;
                    animation: slideUp 0.3s ease-out;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                
                #pwa-install-prompt .prompt-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }
                
                #pwa-install-prompt .prompt-title {
                    font-size: 18px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                #pwa-install-prompt .close-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }
                
                #pwa-install-prompt .close-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                #pwa-install-prompt .prompt-content {
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 15px;
                }
                
                #pwa-install-prompt .install-steps {
                    background: rgba(255,255,255,0.15);
                    border-radius: 8px;
                    padding: 12px;
                    margin: 10px 0;
                    font-size: 13px;
                }
                
                #pwa-install-prompt .install-steps ol {
                    margin: 8px 0;
                    padding-left: 20px;
                }
                
                #pwa-install-prompt .install-steps li {
                    margin: 6px 0;
                }
                
                #pwa-install-prompt .benefits {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 12px;
                }
                
                #pwa-install-prompt .benefit {
                    background: rgba(255,255,255,0.2);
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
            </style>
            
            <div class="prompt-header">
                <div class="prompt-title">
                    <span>🔔</span>
                    <span>プッシュ通知を有効にする</span>
                </div>
                <button class="close-btn" onclick="dismissPWAPrompt()">×</button>
            </div>
            
            <div class="prompt-content">
                <p>
                    <strong>ホーム画面に追加</strong>して、イベント通知を受け取りましょう！
                </p>
                
                <div class="install-steps">
                    <strong>📱 インストール手順：</strong>
                    <ol>
                        <li>Safari下部の <strong>「共有」ボタン</strong> <span style="font-size: 16px;">⎋</span> をタップ</li>
                        <li><strong>「ホーム画面に追加」</strong>を選択</li>
                        <li>追加されたアイコンからアプリを起動</li>
                    </ol>
                </div>
                
                <div class="benefits">
                    <div class="benefit">✅ プッシュ通知</div>
                    <div class="benefit">⚡ 高速起動</div>
                    <div class="benefit">📱 アプリライク</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Add dismiss function to global scope
        window.dismissPWAPrompt = function() {
            prompt.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => {
                prompt.remove();
            }, 300);
            localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
        };
        
        // Add slide down animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    transform: translateY(0);
                }
                to {
                    transform: translateY(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
})();
