import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">About Us</h3>
            <p className="text-gray-400">
              Bringing you the best video content from creators around the world.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white transition">Home</a></li>
              <li><a href="/upload" className="text-gray-400 hover:text-white transition">Upload</a></li>
              <li><a href="/profile" className="text-gray-400 hover:text-white transition">Profile</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href="https://github.com" className="text-gray-400 hover:text-white transition">
                <Github size={24} />
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-white transition">
                <Twitter size={24} />
              </a>
              <a href="https://linkedin.com" className="text-gray-400 hover:text-white transition">
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} Your Video Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;