clear all;
clc;

A = [2, 4, 6, 8, 9, 10, 11, 12];

Xmat = fft(A)'
X = [
    62,
    -6,
    -6-6*i,
    -6+6*i,
    -(7+sqrt(2)) - (5+5*sqrt(2))*i,
    -(7-sqrt(2)) - (5-5*sqrt(2))*i,
    -(7-sqrt(2)) + (5-5*sqrt(2))*i,
    -(7+sqrt(2)) + (5+5*sqrt(2))*i
]
Xrev = X';
Xrev(2) = X(5);
Xrev(5) = X(2);
Xrev(4) = X(7);
Xrev(7) = X(4);
Xrev'

clf
hold on
plot(abs(Xmat), 'linewidth', 2)
plot(abs(X), 'linewidth', 2)
plot(abs(Xrev), '--', 'linewidth', 2)

grid on
legend('X (MATLAB)', 'X (Cooley-Tukey)', 'X (Cooley-Tukey bit-reversed)')

% Fs = 50; % sample rate (Hz)
% T = 1/Fs; % sample period (sec)

% t = 0:T:1; % one second of time (Fs samples)

% f = 3; % frequency of sine wave (Hz)
% A = 1; % amplitude of sine wave

% x = A*sin(2*pi*f*t)*127; % sine wave
% % x = linspace(127, 127, 51); % DC max amplitude

% X = abs(fft(x))/51 % magnitude of fft of sine wave
% % DC peak ampitude = N*max time domain amplitude
% % dividing result by N:
% % DC peak amplitude = max time domain amplitude

% figure(1)
% clf
% plot(t, x)
% xlabel('seconds')
% ylabel('amplitude')

% figure(2)
% clf
% stem(X)
% xlabel('bins')
% ylabel('amplitude')