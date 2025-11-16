import React, { useState } from 'react';
import { AVAILABLE_PLANS, Plan } from '../services/stripeService';

interface PlanSelectorProps {
  onPlanSelect: (planId: string) => void;
  selectedPlanId?: string;
  showPayButton?: boolean;
  onPaymentClick?: () => void;
  isProcessing?: boolean;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  onPlanSelect,
  selectedPlanId,
  showPayButton = false,
  onPaymentClick,
  isProcessing = false
}) => {
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');

  // Filtrar planes según el ciclo de facturación seleccionado
  const filteredPlans = AVAILABLE_PLANS.filter(plan => 
    billingCycle === 'mensual' 
      ? plan.id.includes('mensual')
      : plan.id.includes('anual')
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">💳 Selecciona tu Plan</h2>
        <p className="text-gray-600">Elige el plan que mejor se adapte a tu negocio</p>
        
        {/* Aviso temporal de mantenimiento */}
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">Sistema de pagos en mantenimiento</p>
              <p className="text-yellow-700 text-sm">Contáctanos por WhatsApp para procesar tu suscripción</p>
            </div>
          </div>
        </div>
        
        {/* Toggle Mensual/Anual */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('mensual')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                billingCycle === 'mensual'
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('anual')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                billingCycle === 'anual'
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-1 text-xs text-green-600 font-bold">-10%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onPlanSelect(plan.id)}
            className={`
              relative rounded-xl p-6 cursor-pointer transition-all duration-200
              ${selectedPlanId === plan.id
                ? 'border-3 border-purple-600 shadow-2xl transform scale-105'
                : 'border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }
              ${plan.popular ? 'bg-gradient-to-br from-purple-50 to-indigo-50' : 'bg-white'}
            `}
          >
            {/* Badge Popular */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                  ⭐ MÁS VISIBILIDAD
                </span>
              </div>
            )}

            {/* Check Selected */}
            {selectedPlanId === plan.id && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">✓</span>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-purple-600">${plan.price}</span>
                <span className="text-gray-600">/{billingCycle === 'mensual' ? 'mes' : 'año'}</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Select Button */}
            <button
              onClick={() => onPlanSelect(plan.id)}
              className={`
                w-full py-3 rounded-lg font-semibold transition-all
                ${selectedPlanId === plan.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {selectedPlanId === plan.id ? '✓ Seleccionado' : `Quiero el ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Button - Temporalmente deshabilitado */}
      {showPayButton && selectedPlanId && (
        <div className="mt-8 text-center">
          <button
            disabled={true}
            className="px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg bg-gray-400 cursor-not-allowed text-gray-600"
          >
            <span className="flex items-center gap-2 justify-center">
              <span>🔧</span>
              Sistema en Mantenimiento
            </span>
          </button>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium mb-2">📞 Contáctanos para procesar tu suscripción:</p>
            <a 
              href="https://wa.me/524444237092?text=Hola%2C%20quiero%20información%20sobre%20planes%20de%20suscripción" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <span>📱</span>
              WhatsApp: +52 444 423 7092
            </a>
          </div>
          
          <p className="mt-4 text-sm text-gray-500">
            🔧 Mantenimiento temporal del sistema de pagos
          </p>
        </div>
      )}

      {/* Info adicional */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-bold text-blue-900 mb-2">ℹ️ Información Importante</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Puedes cancelar en cualquier momento</li>
          <li>✓ Cambio de plan disponible mensualmente</li>
          <li>✓ Primer mes con garantía de satisfacción</li>
          <li>✓ Soporte técnico incluido en todos los planes</li>
        </ul>
      </div>
    </div>
  );
};

export default PlanSelector;
