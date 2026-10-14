import React, { useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Upload, Brain, ShieldAlert, Hash, Blocks, HardDrive, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import AnimatedSection from './common/AnimatedSection';
import IconBox from './common/IconBox';

const steps = [
  { step: '01', title: 'Acquire Evidence', desc: 'Create or select a case and upload evidence with metadata.', icon: Upload },
  { step: '02', title: 'Analyze & Classify', desc: 'Perform malware scanning, OCR and AI-assisted risk classification.', icon: Brain },
  { step: '03', title: 'Adaptive Protection', desc: 'Apply suitable protection based on evidence characteristics and risk.', icon: ShieldAlert },
  { step: '04', title: 'Generate SHA-256', desc: 'Create the evidence\'s cryptographic integrity fingerprint.', icon: Hash },
  { step: '05', title: 'Blockchain Validation', desc: 'Validate and anchor the hash and relevant metadata.', icon: Blocks },
  { step: '06', title: 'Secure Storage', desc: 'Keep protected evidence in secure off-chain storage.', icon: HardDrive },
  { step: '07', title: 'Track Chain of Custody', desc: 'Record authorized evidence access and lifecycle events.', icon: LinkIcon },
  { step: '08', title: 'Verify & Detect Tampering', desc: 'Recalculate the hash and compare it with the anchored value.', icon: ShieldCheck }
];

const Workflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <SectionContainer id="workflow">
      <AnimatedSection>
        <SectionHeading
          badge="EVIDENCE LIFECYCLE"
          title="From Evidence to Verified Integrity"
          align="center"
        />

        <Box sx={{ position: 'relative', mt: { xs: 4, md: 10 }, mb: 4 }}>
          {isDesktop ? (
            // Desktop Layout: Horizontal Timeline
            <Box sx={{ position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'center' }}>
              {/* Connecting Line */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: tokens.colors.border.subtle,
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                }}
              />
              
              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isTop = index % 2 === 0;
                  const Icon = step.icon;

                  return (
                    <Box 
                      key={step.step}
                      sx={{ 
                        position: 'relative', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: '12%',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setActiveStep(index)}
                      onClick={() => setActiveStep(index)}
                    >
                      {/* Top Card */}
                      <Box sx={{ height: '140px', display: 'flex', alignItems: 'flex-end', pb: 2, opacity: isTop ? 1 : 0, pointerEvents: isTop ? 'auto' : 'none', transition: 'all 0.3s' }}>
                        {isTop && (
                          <GlassCard 
                            active={isActive}
                            sx={{ 
                              p: 2, 
                              textAlign: 'center', 
                              transform: isActive ? 'translateY(-8px)' : 'none',
                              transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s'
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                              <Icon size={24} color={isActive ? tokens.colors.accent.blue : tokens.colors.text.secondary} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isActive ? tokens.colors.text.primary : tokens.colors.text.secondary, mb: isActive ? 1 : 0, transition: 'all 0.3s' }}>
                              {step.title}
                            </Typography>
                            <Box sx={{ height: isActive ? 'auto' : 0, overflow: 'hidden', transition: 'all 0.3s', opacity: isActive ? 1 : 0 }}>
                              <Typography variant="caption" sx={{ color: tokens.colors.text.muted }}>
                                {step.desc}
                              </Typography>
                            </Box>
                          </GlassCard>
                        )}
                      </Box>

                      {/* Timeline Node */}
                      <Box
                        sx={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive ? tokens.colors.accent.blue : tokens.colors.bg.primary,
                          border: `2px solid ${isActive ? tokens.colors.accent.blue : tokens.colors.border.subtle}`,
                          boxShadow: isActive ? tokens.shadows.glow(tokens.colors.accent.blue) : 'none',
                          transition: 'all 0.3s',
                          my: 1,
                          zIndex: 2,
                        }}
                      >
                        <Typography variant="caption" sx={{ 
                          color: isActive ? '#FFF' : tokens.colors.text.secondary,
                          fontWeight: 700,
                          fontFamily: tokens.fonts.mono
                        }}>
                          {step.step}
                        </Typography>
                      </Box>

                      {/* Bottom Card */}
                      <Box sx={{ height: '140px', display: 'flex', alignItems: 'flex-start', pt: 2, opacity: !isTop ? 1 : 0, pointerEvents: !isTop ? 'auto' : 'none', transition: 'all 0.3s' }}>
                        {!isTop && (
                          <GlassCard 
                            active={isActive}
                            sx={{ 
                              p: 2, 
                              textAlign: 'center',
                              transform: isActive ? 'translateY(8px)' : 'none',
                              transition: 'transform 0.3s, border-color 0.3s, box-shadow 0.3s'
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                              <Icon size={24} color={isActive ? tokens.colors.accent.blue : tokens.colors.text.secondary} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isActive ? tokens.colors.text.primary : tokens.colors.text.secondary, mb: isActive ? 1 : 0, transition: 'all 0.3s' }}>
                              {step.title}
                            </Typography>
                            <Box sx={{ height: isActive ? 'auto' : 0, overflow: 'hidden', transition: 'all 0.3s', opacity: isActive ? 1 : 0 }}>
                              <Typography variant="caption" sx={{ color: tokens.colors.text.muted }}>
                                {step.desc}
                              </Typography>
                            </Box>
                          </GlassCard>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ) : (
            // Mobile Layout: Vertical Timeline
            <Box sx={{ position: 'relative', pl: 3 }}>
              {/* Vertical Connecting Line */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '19px', // Center of 40px circle
                  width: '2px',
                  backgroundColor: tokens.colors.border.subtle,
                  zIndex: 0,
                }}
              />
              
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const Icon = step.icon;

                return (
                  <Box 
                    key={step.step}
                    sx={{ 
                      position: 'relative', 
                      display: 'flex', 
                      mb: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => setActiveStep(index)}
                  >
                    {/* Timeline Node */}
                    <Box
                      sx={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? tokens.colors.accent.blue : tokens.colors.bg.primary,
                        border: `2px solid ${isActive ? tokens.colors.accent.blue : tokens.colors.border.subtle}`,
                        boxShadow: isActive ? tokens.shadows.glow(tokens.colors.accent.blue) : 'none',
                        transition: 'all 0.3s',
                        position: 'absolute',
                        left: '-11px',
                        top: '12px',
                        zIndex: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ 
                        color: isActive ? '#FFF' : tokens.colors.text.secondary,
                        fontWeight: 700,
                        fontFamily: tokens.fonts.mono
                      }}>
                        {step.step}
                      </Typography>
                    </Box>

                    {/* Content Card */}
                    <Box sx={{ ml: 6, flexGrow: 1 }}>
                      <GlassCard active={isActive} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconBox color={isActive ? 'blue' : 'primary'} size="sm">
                            <Icon size={20} />
                          </IconBox>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isActive ? tokens.colors.text.primary : tokens.colors.text.secondary }}>
                            {step.title}
                          </Typography>
                        </Box>
                        <Box sx={{ height: isActive ? 'auto' : 0, overflow: 'hidden', transition: 'all 0.3s', opacity: isActive ? 1 : 0 }}>
                          <Typography variant="body2" sx={{ color: tokens.colors.text.muted, mt: 1 }}>
                            {step.desc}
                          </Typography>
                        </Box>
                      </GlassCard>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </AnimatedSection>
    </SectionContainer>
  );
};

export default Workflow;
