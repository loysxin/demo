
const MAX_VALUE = 100;
const STEP = 0.1;
const NUM_ENTRIES = MAX_VALUE / STEP + 1;  // 计算数组应有的元素数量

const sqrtTable = [0.0000, 0.3162, 0.4472, 0.5477, 0.6325, 0.7071, 0.7746, 0.8367, 0.8944, 0.9487, 1.0000, 1.0488, 1.0954, 1.1402, 1.1832, 1.2247, 1.2649, 1.3038, 1.3416, 1.3784, 1.4142, 1.4491, 1.4832, 1.5166, 1.5492, 1.5811, 1.6125, 1.6432, 1.6733, 1.7029, 1.7321, 1.7607, 1.7889, 1.8166, 1.8439, 1.8708, 1.8974, 1.9235, 1.9494, 1.9748, 2.0000, 2.0248, 2.0494, 2.0736, 2.0976, 2.1213, 2.1448, 2.1679, 2.1909, 2.2136, 2.2361, 2.2583, 2.2804, 2.3022, 2.3238, 2.3452, 2.3664, 2.3875, 2.4083, 2.4290, 2.4495, 2.4698, 2.4900, 2.5100, 2.5298, 2.5495, 2.5690, 2.5884, 2.6077, 2.6268, 2.6458, 2.6646, 2.6833, 2.7019, 2.7203, 2.7386, 2.7568, 2.7749, 2.7928, 2.8107, 2.8284, 2.8460, 2.8636, 2.8810, 2.8983, 2.9155, 2.9326, 2.9496, 2.9665, 2.9833, 3.0000, 3.0166, 3.0332, 3.0496, 3.0659, 3.0822, 3.0984, 3.1145, 3.1305, 3.1464, 3.1623, 3.1780, 3.1937, 3.2094, 3.2249, 3.2404, 3.2558, 3.2711, 3.2863, 3.3015, 3.3166, 3.3317, 3.3466, 3.3615, 3.3764, 3.3912, 3.4059, 3.4205, 3.4351, 3.4496, 3.4641, 3.4785, 3.4928, 3.5071, 3.5214, 3.5355, 3.5496, 3.5637, 3.5777, 3.5917, 3.6056, 3.6194, 3.6332, 3.6469, 3.6606, 3.6742, 3.6878, 3.7014, 3.7148, 3.7283, 3.7417, 3.7550, 3.7683, 3.7815, 3.7947, 3.8079, 3.8210, 3.8341, 3.8471, 3.8601, 3.8730, 3.8859, 3.8987, 3.9115, 3.9243, 3.9370, 3.9497, 3.9623, 3.9749, 3.9875, 4.0000, 4.0125, 4.0249, 4.0373, 4.0497, 4.0620, 4.0743, 4.0866, 4.0988, 4.1110, 4.1231, 4.1352, 4.1473, 4.1593, 4.1713, 4.1833, 4.1952, 4.2071, 4.2190, 4.2308, 4.2426, 4.2544, 4.2661, 4.2778, 4.2895, 4.3012, 4.3128, 4.3243, 4.3359, 4.3474, 4.3589, 4.3704, 4.3818, 4.3932, 4.4045, 4.4159, 4.4272, 4.4385, 4.4497, 4.4609, 4.4721, 4.4833, 4.4944, 4.5056, 4.5166, 4.5277, 4.5387, 4.5497, 4.5607, 4.5717, 4.5826, 4.5935, 4.6043, 4.6152, 4.6260, 4.6368, 4.6476, 4.6583, 4.6690, 4.6797, 4.6904, 4.7011, 4.7117, 4.7223, 4.7329, 4.7434, 4.7539, 4.7645, 4.7749, 4.7854, 4.7958, 4.8062, 4.8166, 4.8270, 4.8374, 4.8477, 4.8580, 4.8683, 4.8785, 4.8888, 4.8990, 4.9092, 4.9193, 4.9295, 4.9396, 4.9497, 4.9598, 4.9699, 4.9800, 4.9900, 5.0000, 5.0100, 5.0200, 5.0299, 5.0398, 5.0498, 5.0596, 5.0695, 5.0794, 5.0892, 5.0990, 5.1088, 5.1186, 5.1284, 5.1381, 5.1478, 5.1575, 5.1672, 5.1769, 5.1865, 5.1962, 5.2058, 5.2154, 5.2249, 5.2345, 5.2440, 5.2536, 5.2631, 5.2726, 5.2820, 5.2915, 5.3009, 5.3104, 5.3198, 5.3292, 5.3385, 5.3479, 5.3572, 5.3666, 5.3759, 5.3852, 5.3944, 5.4037, 5.4129, 5.4222, 5.4314, 5.4406, 5.4498, 5.4589, 5.4681, 5.4772, 5.4863, 5.4955, 5.5045, 5.5136, 5.5227, 5.5317, 5.5408, 5.5498, 5.5588, 5.5678, 5.5767, 5.5857, 5.5946, 5.6036, 5.6125, 5.6214, 5.6303, 5.6391, 5.6480, 5.6569, 5.6657, 5.6745, 5.6833, 5.6921, 5.7009, 5.7096, 5.7184, 5.7271, 5.7359, 5.7446, 5.7533, 5.7619, 5.7706, 5.7793, 5.7879, 5.7966, 5.8052, 5.8138, 5.8224, 5.8310, 5.8395, 5.8481, 5.8566, 5.8652, 5.8737, 5.8822, 5.8907, 5.8992, 5.9076, 5.9161, 5.9245, 5.9330, 5.9414, 5.9498, 5.9582, 5.9666, 5.9749, 5.9833, 5.9917, 6.0000, 6.0083, 6.0166, 6.0249, 6.0332, 6.0415, 6.0498, 6.0581, 6.0663, 6.0745, 6.0828, 6.0910, 6.0992, 6.1074, 6.1156, 6.1237, 6.1319, 6.1400, 6.1482, 6.1563, 6.1644, 6.1725, 6.1806, 6.1887, 6.1968, 6.2048, 6.2129, 6.2209, 6.2290, 6.2370, 6.2450, 6.2530, 6.2610, 6.2690, 6.2769, 6.2849, 6.2929, 6.3008, 6.3087, 6.3166, 6.3246, 6.3325, 6.3403, 6.3482, 6.3561, 6.3640, 6.3718, 6.3797, 6.3875, 6.3953, 6.4031, 6.4109, 6.4187, 6.4265, 6.4343, 6.4420, 6.4498, 6.4576, 6.4653, 6.4730, 6.4807, 6.4885, 6.4962, 6.5038, 6.5115, 6.5192, 6.5269, 6.5345, 6.5422, 6.5498, 6.5574, 6.5651, 6.5727, 6.5803, 6.5879, 6.5955, 6.6030, 6.6106, 6.6182, 6.6257, 6.6332, 6.6408, 6.6483, 6.6558, 6.6633, 6.6708, 6.6783, 6.6858, 6.6933, 6.7007, 6.7082, 6.7157, 6.7231, 6.7305, 6.7380, 6.7454, 6.7528, 6.7602, 6.7676, 6.7750, 6.7823, 6.7897, 6.7971, 6.8044, 6.8118, 6.8191, 6.8264, 6.8337, 6.8411, 6.8484, 6.8557, 6.8629, 6.8702, 6.8775, 6.8848, 6.8920, 6.8993, 6.9065, 6.9138, 6.9210, 6.9282, 6.9354, 6.9426, 6.9498, 6.9570, 6.9642, 6.9714, 6.9785, 6.9857, 6.9929, 7.0000, 7.0071, 7.0143, 7.0214, 7.0285, 7.0356, 7.0427, 7.0498, 7.0569, 7.0640, 7.0711, 7.0781, 7.0852, 7.0922, 7.0993, 7.1063, 7.1134, 7.1204, 7.1274, 7.1344, 7.1414, 7.1484, 7.1554, 7.1624, 7.1694, 7.1764, 7.1833, 7.1903, 7.1972, 7.2042, 7.2111, 7.2180, 7.2250, 7.2319, 7.2388, 7.2457, 7.2526, 7.2595, 7.2664, 7.2732, 7.2801, 7.2870, 7.2938, 7.3007, 7.3075, 7.3144, 7.3212, 7.3280, 7.3348, 7.3417, 7.3485, 7.3553, 7.3621, 7.3689, 7.3756, 7.3824, 7.3892, 7.3959, 7.4027, 7.4095, 7.4162, 7.4229, 7.4297, 7.4364, 7.4431, 7.4498, 7.4565, 7.4632, 7.4699, 7.4766, 7.4833, 7.4900, 7.4967, 7.5033, 7.5100, 7.5166, 7.5233, 7.5299, 7.5366, 7.5432, 7.5498, 7.5565, 7.5631, 7.5697, 7.5763, 7.5829, 7.5895, 7.5961, 7.6026, 7.6092, 7.6158, 7.6223, 7.6289, 7.6354, 7.6420, 7.6485, 7.6551, 7.6616, 7.6681, 7.6746, 7.6811, 7.6877, 7.6942, 7.7006, 7.7071, 7.7136, 7.7201, 7.7266, 7.7330, 7.7395, 7.7460, 7.7524, 7.7589, 7.7653, 7.7717, 7.7782, 7.7846, 7.7910, 7.7974, 7.8038, 7.8102, 7.8166, 7.8230, 7.8294, 7.8358, 7.8422, 7.8486, 7.8549, 7.8613, 7.8677, 7.8740, 7.8804, 7.8867, 7.8930, 7.8994, 7.9057, 7.9120, 7.9183, 7.9246, 7.9310, 7.9373, 7.9436, 7.9498, 7.9561, 7.9624, 7.9687, 7.9750, 7.9812, 7.9875, 7.9937, 8.0000, 8.0062, 8.0125, 8.0187, 8.0250, 8.0312, 8.0374, 8.0436, 8.0498, 8.0561, 8.0623, 8.0685, 8.0747, 8.0808, 8.0870, 8.0932, 8.0994, 8.1056, 8.1117, 8.1179, 8.1240, 8.1302, 8.1363, 8.1425, 8.1486, 8.1548, 8.1609, 8.1670, 8.1731, 8.1792, 8.1854, 8.1915, 8.1976, 8.2037, 8.2098, 8.2158, 8.2219, 8.2280, 8.2341, 8.2401, 8.2462, 8.2523, 8.2583, 8.2644, 8.2704, 8.2765, 8.2825, 8.2885, 8.2946, 8.3006, 8.3066, 8.3126, 8.3187, 8.3247, 8.3307, 8.3367, 8.3427, 8.3487, 8.3546, 8.3606, 8.3666, 8.3726, 8.3785, 8.3845, 8.3905, 8.3964, 8.4024, 8.4083, 8.4143, 8.4202, 8.4261, 8.4321, 8.4380, 8.4439, 8.4499, 8.4558, 8.4617, 8.4676, 8.4735, 8.4794, 8.4853, 8.4912, 8.4971, 8.5029, 8.5088, 8.5147, 8.5206, 8.5264, 8.5323, 8.5381, 8.5440, 8.5499, 8.5557, 8.5615, 8.5674, 8.5732, 8.5790, 8.5849, 8.5907, 8.5965, 8.6023, 8.6081, 8.6139, 8.6197, 8.6255, 8.6313, 8.6371, 8.6429, 8.6487, 8.6545, 8.6603, 8.6660, 8.6718, 8.6776, 8.6833, 8.6891, 8.6948, 8.7006, 8.7063, 8.7121, 8.7178, 8.7235, 8.7293, 8.7350, 8.7407, 8.7464, 8.7521, 8.7579, 8.7636, 8.7693, 8.7750, 8.7807, 8.7864, 8.7920, 8.7977, 8.8034, 8.8091, 8.8148, 8.8204, 8.8261, 8.8318, 8.8374, 8.8431, 8.8487, 8.8544, 8.8600, 8.8657, 8.8713, 8.8769, 8.8826, 8.8882, 8.8938, 8.8994, 8.9051, 8.9107, 8.9163, 8.9219, 8.9275, 8.9331, 8.9387, 8.9443, 8.9499, 8.9554, 8.9610, 8.9666, 8.9722, 8.9778, 8.9833, 8.9889, 8.9944, 9.0000, 9.0056, 9.0111, 9.0167, 9.0222, 9.0277, 9.0333, 9.0388, 9.0443, 9.0499, 9.0554, 9.0609, 9.0664, 9.0719, 9.0774, 9.0830, 9.0885, 9.0940, 9.0995, 9.1049, 9.1104, 9.1159, 9.1214, 9.1269, 9.1324, 9.1378, 9.1433, 9.1488, 9.1542, 9.1597, 9.1652, 9.1706, 9.1761, 9.1815, 9.1869, 9.1924, 9.1978, 9.2033, 9.2087, 9.2141, 9.2195, 9.2250, 9.2304, 9.2358, 9.2412, 9.2466, 9.2520, 9.2574, 9.2628, 9.2682, 9.2736, 9.2790, 9.2844, 9.2898, 9.2952, 9.3005, 9.3059, 9.3113, 9.3167, 9.3220, 9.3274, 9.3327, 9.3381, 9.3434, 9.3488, 9.3541, 9.3595, 9.3648, 9.3702, 9.3755, 9.3808, 9.3862, 9.3915, 9.3968, 9.4021, 9.4074, 9.4128, 9.4181, 9.4234, 9.4287, 9.4340, 9.4393, 9.4446, 9.4499, 9.4552, 9.4604, 9.4657, 9.4710, 9.4763, 9.4816, 9.4868, 9.4921, 9.4974, 9.5026, 9.5079, 9.5131, 9.5184, 9.5237, 9.5289, 9.5341, 9.5394, 9.5446, 9.5499, 9.5551, 9.5603, 9.5656, 9.5708, 9.5760, 9.5812, 9.5864, 9.5917, 9.5969, 9.6021, 9.6073, 9.6125, 9.6177, 9.6229, 9.6281, 9.6333, 9.6385, 9.6437, 9.6488, 9.6540, 9.6592, 9.6644, 9.6695, 9.6747, 9.6799, 9.6850, 9.6902, 9.6954, 9.7005, 9.7057, 9.7108, 9.7160, 9.7211, 9.7263, 9.7314, 9.7365, 9.7417, 9.7468, 9.7519, 9.7570, 9.7622, 9.7673, 9.7724, 9.7775, 9.7826, 9.7877, 9.7929, 9.7980, 9.8031, 9.8082, 9.8133, 9.8184, 9.8234, 9.8285, 9.8336, 9.8387, 9.8438, 9.8489, 9.8539, 9.8590, 9.8641, 9.8691, 9.8742, 9.8793, 9.8843, 9.8894, 9.8944, 9.8995, 9.9045, 9.9096, 9.9146, 9.9197, 9.9247, 9.9298, 9.9348, 9.9398, 9.9448, 9.9499, 9.9549, 9.9599, 9.9649, 9.9700, 9.9750, 9.9800, 9.9850, 9.9900, 9.9950, 10.0000];

function sqrt(x, epsilon = 1e-4, maxIterations = 10)
{
    if (x < 0) return NaN;
    if (x === 0) return 0;

    let guess = x;
  
    for (let i = 0; i < maxIterations; i++) {
      const approx = 0.5 * (guess + x / guess);
      
      if (Math.abs(approx - guess) < epsilon) {
        return approx;  // 直接返回，不使用 toFixed
      }
      
      guess = approx;
    }
  
    return guess;  // 直接返回，不使用 toFixed
}

export function customSqrt(x) {
    return sqrt(x);

    if (x >= 0 && x <= MAX_VALUE) {
        let tableIndex = Math.round(x / STEP);
        return sqrtTable[tableIndex];
    } else {
        return sqrt(x);
    }
}
