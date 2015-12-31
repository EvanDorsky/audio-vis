#include <fftw3.h>

int main(int argc, char *argv[]) {
    int N = 8;

    fftw_complex *in, *out;
    fftw_plan p;
    in = (fftw_complex*) fftw_malloc(N * sizeof(fftw_complex));
    out = (fftw_complex*) fftw_malloc(N * sizeof(fftw_complex));

    p = fftw_plan_dft_1d(N, in, out, FFTW_FORWARD, FFTW_ESTIMATE);

    in[0][0] = 2;
    in[1][0] = 4;
    in[2][0] = 6;
    in[3][0] = 8;
    in[4][0] = 9;
    in[5][0] = 10;
    in[6][0] = 11;
    in[7][0] = 12;

    fftw_execute(p);

    printf("Output\n");
    for (int i = 0; i < N; i++) {
        printf("%f\n", out[i][0]);
    }

    fftw_destroy_plan(p);
    fftw_free(in);
    fftw_free(out);
    return 0;
}