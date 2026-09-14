import { Link } from "react-router-dom";

export default function Header() {
    return (
        <header className="flex justify-between items-center p-1 px-8 gap-6 bg-[#C9DAEA]">
            <a className="bg-[#D83277] text-white px-2.5 rounded text-sm truncate" href="https://ryancunha.vercel.app">Site @ryancunhadev</a>
            
            <div className="text-[#666]">
                <Link to="/" >Home</Link>
            </div>
        </header>
    )
}