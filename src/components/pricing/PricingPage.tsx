import { CheckCircle, Code, ExternalLink, Github, Globe, Heart, Shield, Sparkles, Star, Users, Zap } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

export default function PricingPage() {
  const { t } = useLanguage();
  const { themeConfig } = useTheme();

  const handlePatreonSupport = () => {
    window.open('https://patreon.com/studorama', '_blank', 'noopener,noreferrer');
  };

  const handleGitHubVisit = () => {
    window.open('https://github.com/gustavokch/studorama', '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="min-h-screen py-6 sm:py-8 lg:py-12 safe-top safe-bottom"
      style={{ background: themeConfig.gradients.background }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 max-w-4xl mx-auto">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full mb-6 sm:mb-8 shadow-2xl animate-pulse-slow"
            style={{ 
              background: themeConfig.gradients.primary,
              boxShadow: `0 20px 60px ${themeConfig.colors.primary}40`
            }}
          >
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white animate-pulse" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 px-2 leading-tight" style={{ color: themeConfig.colors.text }}>
            {t.supportStudorama}
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto mb-6 sm:mb-8 px-4 leading-relaxed" style={{ color: themeConfig.colors.textSecondary }}>
            {t.supportStudoramaDesc}
          </p>
          
          {/* Free Forever Badge */}
          <div 
            className="inline-flex items-center space-x-3 px-6 py-3 sm:px-8 sm:py-4 rounded-full shadow-lg mb-6 sm:mb-8 animate-bounce-gentle"
            style={{
              background: themeConfig.gradients.primary,
              color: 'white'
            }}
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            <span className="font-bold text-base sm:text-lg">{t.freeForever}</span>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed px-4" style={{ color: themeConfig.colors.textSecondary }}>
            {t.freeForeverDesc}
          </p>
        </div>

        {/* Key Benefits Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div 
              className="text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: themeConfig.colors.surface,
                borderColor: themeConfig.colors.border
              }}
            >
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: themeConfig.colors.success + '20' }}
              >
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: themeConfig.colors.success }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: themeConfig.colors.text }}>
                {t.noAccountRequired}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: themeConfig.colors.textSecondary }}>
                {t.startLearningImmediately}! {t.noAccountRequiredDesc}
              </p>
            </div>

            <div 
              className="text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: themeConfig.colors.surface,
                borderColor: themeConfig.colors.border
              }}
            >
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: themeConfig.colors.info + '20' }}
              >
                <Shield className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: themeConfig.colors.info }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: themeConfig.colors.text }}>
                {t.privacyFocused}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: themeConfig.colors.textSecondary }}>
                {t.dataStaysInBrowser}. {t.noTrackingOrAnalytics}. {t.completeAnonymity}.
              </p>
            </div>

            <div 
              className="text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 sm:col-span-2 lg:col-span-1"
              style={{
                backgroundColor: themeConfig.colors.surface,
                borderColor: themeConfig.colors.border
              }}
            >
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
                style={{ backgroundColor: themeConfig.colors.primary + '20' }}
              >
                <Code className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: themeConfig.colors.primary }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: themeConfig.colors.text }}>
                {t.openSourceProject}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: themeConfig.colors.textSecondary }}>
                {t.openSourceDescription}
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Repository Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div 
            className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border shadow-xl max-w-4xl mx-auto text-center"
            style={{
              backgroundColor: themeConfig.colors.surface,
              borderColor: themeConfig.colors.border
            }}
          >
            <div 
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-6 shadow-lg"
              style={{ backgroundColor: '#24292e' }}
            >
              <Github className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{ color: themeConfig.colors.text }}>
              {t.openSourceOnGitHub}
            </h2>
            
            <p className="text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: themeConfig.colors.textSecondary }}>
              {t.openSourceOnGitHubDesc}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <button
                onClick={handleGitHubVisit}
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#24292e', color: 'white' }}
              >
                <Github className="w-5 h-5 sm:w-6 sm:h-6 mr-3" />
                <span className="text-base sm:text-lg">{t.viewOnGitHub}</span>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </button>
              
              <div className="flex items-center space-x-4 text-sm sm:text-base" style={{ color: themeConfig.colors.textMuted }}>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{t.stars}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Code className="w-4 h-4" />
                  <span>{t.forks}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{t.contributors}</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm mt-4 sm:mt-6" style={{ color: themeConfig.colors.textMuted }}>
              github.com/gustavokch/studorama
            </p>
          </div>
        </div>

        {/* Patreon Support Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div 
            className="rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 text-center max-w-4xl mx-auto"
            style={{ 
              background: themeConfig.gradients.primary,
              boxShadow: `0 25px 80px ${themeConfig.colors.primary}30`
            }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full mb-6 sm:mb-8 animate-pulse">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              {t.supportOnPatreon}
            </h2>
            
            <p className="text-white/90 mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
              {t.supportOnPatreonDesc}
            </p>
            
            <button
              onClick={handlePatreonSupport}
              className="inline-flex items-center bg-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold hover:bg-gray-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 active:scale-95 text-base sm:text-lg lg:text-xl"
              style={{ color: themeConfig.colors.primary }}
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-3 animate-pulse" />
              <span>
                {t.supportOnPatreonButton}
              </span>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-3" />
            </button>
            
            <p className="text-white/80 text-sm sm:text-base mt-4 sm:mt-6">
              patreon.com/studorama
            </p>
          </div>
        </div>

        {/* Why Support Section */}
        <div 
          className="rounded-2xl sm:rounded-3xl shadow-xl border p-6 sm:p-8 lg:p-10 mb-12 sm:mb-16"
          style={{
            backgroundColor: themeConfig.colors.surface,
            borderColor: themeConfig.colors.border
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 px-2" style={{ color: themeConfig.colors.text }}>
            {t.whySponsorStudorama}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Star, title: t.keepItFree, desc: t.keepItFreeDesc, color: themeConfig.colors.info },
              { icon: Zap, title: t.fundDevelopment, desc: t.fundDevelopmentDesc, color: themeConfig.colors.success },
              { icon: Globe, title: t.serverCosts, desc: t.serverCostsDesc, color: themeConfig.colors.primary },
              { icon: Shield, title: t.privacyFirst, desc: t.privacyFirstDesc, color: themeConfig.colors.warning }
            ].map(({ icon: Icon, title, desc, color }, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                  style={{ backgroundColor: color + '20' }}
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color }} />
                </div>
                <h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg" style={{ color: themeConfig.colors.text }}>
                  {title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: themeConfig.colors.textSecondary }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Transparency Section */}
        <div className="text-center max-w-4xl mx-auto">
          <div 
            className="border rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg"
            style={{
              backgroundColor: themeConfig.colors.info + '10',
              borderColor: themeConfig.colors.info + '30'
            }}
          >
            <div 
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-6 sm:mb-8"
              style={{ backgroundColor: themeConfig.colors.info + '20' }}
            >
              <Shield className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: themeConfig.colors.info }} />
            </div>
            
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6" style={{ color: themeConfig.colors.info }}>
              {t.transparencyTrust}
            </h3>
            
            <p className="text-sm sm:text-base lg:text-lg leading-relaxed" style={{ color: themeConfig.colors.info }}>
              {t.transparencyTrustDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
