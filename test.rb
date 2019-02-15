def rotate_array(array)
  array[1..-1] + [array[0]]
end

def max_rotation int
  final_string = ''
  int_str_array = int.to_s.chars
  loop do
    int_str_array = rotate_array(int_str_array)
    final_string << int_str_array.shift
    break if int_str_array.size <= 1
  end
  final_string.to_i
end

puts max_rotation(735291) # == 321579
