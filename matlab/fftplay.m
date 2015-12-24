clear all;
clc;

Fs = 50; % sample rate (Hz)
T = 1/Fs; % sample period (sec)

t = 0:T:1; % one second of time (Fs samples)

f = 3; % frequency of sine wave (Hz)
A = 1; % amplitude of sine wave

x = A*sin(2*pi*f*t)*127; % sine wave
% x = linspace(127, 127, 51); % DC max amplitude

X = abs(fft(x))/51 % magnitude of fft of sine wave
% DC peak ampitude = N*max time domain amplitude
% dividing result by N:
% DC peak amplitude = max time domain amplitude

figure(1)
clf
plot(t, x)
xlabel('seconds')
ylabel('amplitude')

figure(2)
clf
stem(X)
xlabel('bins')
ylabel('amplitude')