import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, Package, CreditCard, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const EnhancedBookingWorkflow = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service: '',
    date: '',
    time: '',
    location: '',
    package: '',
    payment: ''
  });

  const steps = [
    { id: 1, title: 'Select Service', icon: Package },
    { id: 2, title: 'Choose Date & Time', icon: Calendar },
    { id: 3, title: 'Select Location', icon: MapPin },
    { id: 4, title: 'Choose Package', icon: Package },
    { id: 5, title: 'Payment', icon: CreditCard },
    { id: 6, title: 'Confirmation', icon: CheckCircle }
  ];

  const services = [
    { id: 1, name: 'Billboard Advertising', description: 'Premium outdoor advertising spaces' },
    { id: 2, name: 'Digital Display', description: 'LED and digital screen advertising' },
    { id: 3, name: 'Transit Advertising', description: 'Bus, metro, and transit station ads' },
    { id: 4, name: 'Street Furniture', description: 'Bus stops, kiosks, and urban furniture' }
  ];

  const packages = [
    { id: 1, name: 'Basic', duration: '1 Month', price: '$2,500', features: ['Single location', 'Standard size', 'Basic analytics'] },
    { id: 2, name: 'Professional', duration: '3 Months', price: '$6,500', features: ['3 locations', 'Premium size', 'Advanced analytics', 'Design support'] },
    { id: 3, name: 'Enterprise', duration: '6 Months', price: '$12,000', features: ['5+ locations', 'Custom sizes', 'Real-time analytics', 'Dedicated support', 'A/B testing'] }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-6">Select Your Advertising Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    "p-6 border-2 rounded-lg cursor-pointer transition-all",
                    "hover:border-blue-500 hover:shadow-md",
                    bookingData.service === service.name ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  )}
                  onClick={() => setBookingData({ ...bookingData, service: service.name })}
                >
                  <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-6">Choose Date & Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Start Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Setup Time</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning (6 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                  <option value="evening">Evening (6 PM - 10 PM)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-6">Select Advertising Locations</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search locations..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Interactive map would be displayed here</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-6">Choose Your Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    "p-6 border-2 rounded-lg cursor-pointer transition-all",
                    "hover:border-blue-500 hover:shadow-md",
                    bookingData.package === pkg.name ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  )}
                  onClick={() => setBookingData({ ...bookingData, package: pkg.name })}
                >
                  <h4 className="font-semibold text-lg mb-2">{pkg.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{pkg.price}</p>
                  <p className="text-sm text-gray-500 mb-4">{pkg.duration}</p>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-6">Payment Information</h3>
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold">Booking Confirmed!</h3>
            <p className="text-gray-600">Your advertising campaign has been successfully booked.</p>
            <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto text-left">
              <h4 className="font-semibold mb-3">Booking Summary:</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Service:</span> {bookingData.service || 'Not selected'}</p>
                <p><span className="font-medium">Date:</span> {bookingData.date || 'Not selected'}</p>
                <p><span className="font-medium">Package:</span> {bookingData.package || 'Not selected'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content with proper top spacing to account for sticky header */}
      <div className="pt-4 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps - Mobile responsive */}
          <div className="mb-8">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center min-w-[80px] sm:min-w-[100px]">
                      <div
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all",
                          currentStep >= step.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        )}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className={cn(
                        "text-xs sm:text-sm mt-2 text-center",
                        currentStep >= step.id ? "text-blue-600 font-medium" : "text-gray-500"
                      )}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2",
                          currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                        )}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handlePrevious}
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg transition-all",
                  currentStep === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              <button
                onClick={handleNext}
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg transition-all",
                  currentStep === steps.length
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {currentStep === steps.length ? 'Complete' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBookingWorkflow;