import React from 'react';
import { AlertTriangle, Phone, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface CrisisAlertProps {
  isVisible: boolean;
  onClose: () => void;
  onEmergencyCall: () => void;
}

const CrisisAlert: React.FC<CrisisAlertProps> = ({ isVisible, onClose, onEmergencyCall }) => {
  if (!isVisible) return null;

  const emergencyNumbers = [
    { name: 'National Suicide Prevention', number: '9152987821', available: '24/7' },
    { name: 'AASRA Helpline', number: '91-9820466726', available: '24/7' },
    { name: 'Vandrevala Foundation', number: '1860-2662-345', available: '24/7' },
    { name: 'Emergency Services', number: '112', available: '24/7' },
    { name: 'Jeevan Aastha Helpline', number: '1800-233-3330', available: '24/7' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-l-4 border-red-500"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Crisis Support Available</h3>
            <p className="text-sm text-gray-600">You don't have to face this alone</p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            I'm concerned about what you're going through. Your life has value, and help is available right now.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">
              If you're in immediate danger, please call emergency services or go to your nearest emergency room.
            </p>
          </div>
        </div>

        {/* Emergency Numbers */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-red-600" />
            Immediate Help Available
          </h4>
          <div className="space-y-2">
            {emergencyNumbers.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-600">{contact.available}</p>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  {contact.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Questions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Heart className="w-4 h-4 mr-2" />
            Safety Check
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Are you in a safe place right now?</p>
            <p>• Is there someone who can be with you?</p>
            <p>• Do you have a plan to stay safe tonight?</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onEmergencyCall}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Phone className="w-4 h-4" />
            <span>Call Help Now</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Stay Here
          </button>
        </div>

        {/* Additional Resources */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Remember: Crisis feelings are temporary. Professional help can make a difference.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CrisisAlert;
