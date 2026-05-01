import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-ink mt-auto">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="font-display font-semibold text-zinc-100 mb-4">AlphaForge</h3>
            <p className="text-sm text-zinc-500 max-w-[200px]">
              Professional forex trading bots, indicators, and signals. Trade smarter with automation and proven strategies.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-zinc-300 mb-4">Products</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="text-sm text-zinc-500 hover:text-zinc-300">All products</Link>
              </li>
              <li>
                <Link to="/shop?featured=1" className="text-sm text-zinc-500 hover:text-zinc-300">Featured</Link>
              </li>
              <li>
                <Link to="/shop?category=expert-advisors" className="text-sm text-zinc-500 hover:text-zinc-300">Expert Advisors</Link>
              </li>
              <li>
                <Link to="/shop?category=indicators" className="text-sm text-zinc-500 hover:text-zinc-300">Indicators</Link>
              </li>
              <li>
                <Link to="/shop?category=signals-subscriptions" className="text-sm text-zinc-500 hover:text-zinc-300">Signals</Link>
              </li>
              <li>
                <Link to="/shop?category=education" className="text-sm text-zinc-500 hover:text-zinc-300">Education</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-zinc-300 mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">Contact</a></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">Installation guide</a></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">Refund policy</a></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-zinc-300 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">Privacy</a></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">Terms of service</a></li>
              <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300">Risk disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} AlphaForge. Forex trading involves risk. Past performance is not indicative of future results.
        </div>
      </div>
    </footer>
  )
}
