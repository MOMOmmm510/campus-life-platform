export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#1e3a5f] text-center text-blue-200">
      <div className="mx-auto flex h-20 max-w-6xl flex-col items-center justify-center gap-2 px-6">
        {/* Social icons */}
        <div className="flex items-center gap-4">
          {/* 微信 */}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/30 text-xs text-blue-300 transition hover:border-blue-200 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM8.515 4.66c.48 0 .87.383.87.855a.863.863 0 0 1-.87.855.863.863 0 0 1-.87-.855c0-.472.39-.855.87-.855zM5.79 4.66c.48 0 .87.383.87.855a.863.863 0 0 1-.87.855.863.863 0 0 1-.87-.855c0-.472.39-.855.87-.855zm8.38 2.304c.64 0 1.16.511 1.16 1.14 0 .63-.52 1.14-1.16 1.14-.64 0-1.16-.51-1.16-1.14 0-.629.52-1.14 1.16-1.14zm-3.48 0c.64 0 1.16.511 1.16 1.14 0 .63-.52 1.14-1.16 1.14-.64 0-1.16-.51-1.16-1.14 0-.629.52-1.14 1.16-1.14z"/>
            </svg>
          </span>
          {/* QQ */}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/30 text-xs text-blue-300 transition hover:border-blue-200 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M22.914 10.702a7.088 7.088 0 0 0-1.128-2.297c.28-2.21-.118-4.654-1.568-6.043C18.444.527 15.463.15 12.004.149c-3.459 0-6.44.378-8.214 2.213-1.45 1.389-1.849 3.833-1.569 6.043a7.088 7.088 0 0 0-1.128 2.297c-.476 1.65-.466 3.346.404 4.603.413.624 1.08 1.104 1.857 1.395.313.117.655.213 1.02.283.472.09.79.416.87.85.12.649-.1 1.136-.64 1.454-.564.333-1.245.48-1.875.508-.164.008-.318.059-.432.168-.155.148-.14.36.006.506.498.5 1.313.844 2.248.99.583.09 1.176.12 1.764.12.585 0 1.163-.042 1.7-.12.534-.076 1.077-.316 1.29-.848.222-.555.076-1.053-.369-1.349-.452-.3-.94-.404-1.323-.488-.258-.056-.706-.153-.565-.454.089-.19.24-.31.413-.38.13-.753.637-1.366 1.472-1.545.39-.084.835-.114 1.38-.114h.755c.546 0 .991.03 1.381.114.835.179 1.341.792 1.472 1.545.172.07.323.19.413.38.141.301-.307.398-.565.454-.383.084-.871.188-1.323.488-.445.296-.591.794-.369 1.349.213.532.756.772 1.29.848.537.078 1.115.12 1.7.12.588 0 1.18-.03 1.764-.12.935-.146 1.75-.49 2.248-.99.146-.146.161-.358.006-.506a.66.66 0 0 0-.432-.168c-.63-.028-1.311-.175-1.876-.508-.539-.318-.758-.805-.639-1.454.08-.434.398-.76.87-.85.365-.07.707-.166 1.02-.283.777-.291 1.444-.771 1.857-1.395.87-1.257.88-2.953.404-4.603z"/>
            </svg>
          </span>
          {/* 微博 */}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/30 text-xs text-blue-300 transition hover:border-blue-200 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443z"/>
            </svg>
          </span>
          {/* 邮箱 */}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-300/30 text-xs text-blue-300 transition hover:border-blue-200 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67z"/>
              <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908z"/>
            </svg>
          </span>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm">&copy; 2025 校园生活服务平台</p>
          <p className="text-xs text-blue-300/70">让校园生活更便捷</p>
        </div>
      </div>
    </footer>
  )
}