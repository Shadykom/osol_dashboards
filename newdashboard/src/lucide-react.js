import React from 'react';

// This file mocks the lucide-react icons used throughout the skeleton.  Each
// export is a simple React component that renders its own name.  When you
// integrate this code into your project you should install the real
// `lucide-react` package and remove this file.

const makeIcon = (name) => {
  return (props) => <span {...props}>{name}</span>;
};

export const DollarSign = makeIcon('DollarSign');
export const Users = makeIcon('Users');
export const CreditCard = makeIcon('CreditCard');
export const Activity = makeIcon('Activity');
export const TrendingUp = makeIcon('TrendingUp');
export const Shield = makeIcon('Shield');
export const Building2 = makeIcon('Building2');
export const Package = makeIcon('Package');
export const Scale = makeIcon('Scale');
export const PieChart = makeIcon('PieChart');
export const BarChart3 = makeIcon('BarChart3');
export const LineChart = makeIcon('LineChart');
export const Percent = makeIcon('Percent');
export const Timer = makeIcon('Timer');
export const Target = makeIcon('Target');
export const Brain = makeIcon('Brain');
export const Zap = makeIcon('Zap');
export const Calendar = makeIcon('Calendar');
export const Clock = makeIcon('Clock');
export const AlertCircle = makeIcon('AlertCircle');
export const CheckCircle = makeIcon('CheckCircle');
export const Banknote = makeIcon('Banknote');
export const Wallet = makeIcon('Wallet');
export const ArrowLeft = makeIcon('ArrowLeft');
export const Download = makeIcon('Download');
export const FileText = makeIcon('FileText');
export const Printer = makeIcon('Printer');
export const RefreshCw = makeIcon('RefreshCw');
export const ChevronUp = makeIcon('ChevronUp');
export const ChevronDown = makeIcon('ChevronDown');
// Add any additional icons referenced in your components here