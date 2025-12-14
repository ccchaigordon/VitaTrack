function Navbar () {
    return (
    
      <nav className="w-full">
        <div className="w-full flex items-center justify-between px-[150px] h-20">
          <div className="flex items-center gap-2">
            <img src="/src/assets/NavLogo.png" className="w-20 h-20" />
          </div>

          <ul className="flex gap-6 text-gray-700 text-[13px] h-full">
            <li className="flex items-center px-3 py-1 hover:bg-gray-600/30 hover:text-white cursor-pointer">Home</li>
            <li className="flex items-center px-3 py-1 hover:bg-gray-600/30 hover:text-white cursor-pointer">AI Coach</li>
            <li className="flex items-center px-3 py-1 hover:bg-gray-600/30 hover:text-white cursor-pointer">Progress</li>
            <li className="flex items-center px-3 py-1 hover:bg-gray-600/30 hover:text-white cursor-pointer">Resources</li>
            <li className="flex items-center px-3 py-1 hover:bg-gray-600/30 hover:text-white cursor-pointer">About</li>
          </ul>



          <div className="flex items-center gap-4 text-[13px] h-full">

            <button className="h-full flex items-center px-4 text-gray-700 hover:bg-gray-600/30 hover:text-white transition cursor-pointer">
                Sign Up
            </button>

            <button className="h-full flex items-center px-4 hover:bg-gray-600/30 text-gray-700 hover:text-white transition cursor-pointer">
                Log In
            </button>

            <img src="/src/assets/Chatbot/user.png" className="w-12 h-12 cursor-pointer" />

          </div>

        </div>
      </nav>    
      
    );
}

export default Navbar;