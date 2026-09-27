import React from 'react';
import { User, Phone, Mail, MapPin, Building2, Briefcase } from 'lucide-react';
import useCartStore from '../store/cartStore';

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="label flex items-center gap-1">
      <Icon size={11} />
      {label}
    </label>
    {children}
  </div>
);

export default function CustomerDetailsForm() {
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);

  const set = (key) => (e) => setCustomer({ [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name *" icon={User}>
          <input
            className="input-field"
            placeholder="Rajesh Kumar"
            value={customer.name}
            onChange={set('name')}
            required
          />
        </Field>
        <Field label="Phone Number *" icon={Phone}>
          <input
            className="input-field"
            type="tel"
            placeholder="+91 98765 43210"
            value={customer.phone}
            onChange={set('phone')}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address" icon={Mail}>
          <input
            className="input-field"
            type="email"
            placeholder="rajesh@example.com"
            value={customer.email}
            onChange={set('email')}
          />
        </Field>
        <Field label="Project Name" icon={Briefcase}>
          <input
            className="input-field"
            placeholder="My Dream Home"
            value={customer.projectName}
            onChange={set('projectName')}
          />
        </Field>
      </div>

      <Field label="Address" icon={MapPin}>
        <input
          className="input-field"
          placeholder="Flat 4B, Sunrise Apartments, Andheri West"
          value={customer.address}
          onChange={set('address')}
        />
      </Field>

      <Field label="City" icon={Building2}>
        <input
          className="input-field"
          placeholder="Mumbai"
          value={customer.city}
          onChange={set('city')}
        />
      </Field>
    </div>
  );
}
